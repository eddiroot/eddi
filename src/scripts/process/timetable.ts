import { queueStatusEnum } from '$lib/enums.js';
import {
	getInProgressTimetableQueues,
	getOldestQueuedTimetable,
	updateTimetableDraftError,
	updateTimetableDraftFetResponse,
	updateTimetableQueueStatus
} from '$lib/server/db/service/index.js';
import { FETDockerService } from '$lib/server/fet.js';
import { getFileFromStorage, uploadBufferHelper } from '$lib/server/obj.js';
import { parseTimetableCSVAndPopulate, parseTimetableCSVAndPopulateClasses } from '../utils';

const fetService = new FETDockerService();

export async function processTimetableQueue() {
	const startTime = Date.now();

	try {
		// Check for existing in-progress tasks
		const inProgressQueues = await getInProgressTimetableQueues();
		if (inProgressQueues.length > 0) {
			console.log(
				`⚠️  [TIMETABLE PROCESSOR] Found ${inProgressQueues.length} in-progress tasks. Skipping new task.`
			);
			return;
		}

		// Get the oldest queued task
		const queueEntry = await getOldestQueuedTimetable();
		if (!queueEntry) {
			console.error('📭 [TIMETABLE PROCESSOR] No queued timetables found. Nothing to process.');
			return;
		}

		// Mark task as in progress
		await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.inProgress);

		try {
			const schoolId = queueEntry.school.id.toString();
			const timetableId = queueEntry.timetableId.toString();
			const timetableDraftId = queueEntry.timetableDraftId.toString();
			const fileName = queueEntry.fileName;

			const fileBuffer = await getFileFromStorage(
				schoolId,
				timetableId,
				timetableDraftId,
				fileName,
				true
			);

			// Docker container paths (no local temp file needed)
			const containerTempPath = `/tmp/${queueEntry.id}_${fileName}`;
			const containerOutputDir = `/tmp/output_${queueEntry.id}`;

			// Stream file directly to Docker container using FETDockerService
			await fetService.streamFileToContainer(containerTempPath, fileBuffer);

			// Create output directory in container
			await fetService.createDirectory(containerOutputDir);
			const fetResult = await fetService.executeFET(containerTempPath, containerOutputDir);

			if (!fetResult.success && fetResult.error) {
				await updateTimetableDraftFetResponse(queueEntry.timetableDraftId, fetResult.error);
				throw new Error(`FET processing failed: ${fetResult.stdout}`);
			}

			// List output files in container
			const allFiles = await fetService.listFiles(containerOutputDir);

			// Upload ALL generated files to object storage
			if (allFiles.length > 0) {
				let timetableCSV = ''; // find the file that has all the information that we need

				for (const filePath of allFiles) {
					try {
						const fileName = filePath.split('/').pop() || 'unknown';
						const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

						// Read file content from container using FETDockerService
						const fileContent = await fetService.readFile(filePath);

						// Check for specific files needed for database processing (suffix match)
						if (fileName.endsWith('timetable.csv')) {
							timetableCSV = fileContent;
						}

						// Determine content type based on file extension
						let contentType = 'application/octet-stream';
						if (fileExtension === 'html' || fileExtension === 'htm') {
							contentType = 'text/html';
						} else if (fileExtension === 'xml' || fileExtension === 'fet') {
							contentType = 'application/xml';
						} else if (fileExtension === 'csv') {
							contentType = 'text/csv';
						} else if (fileExtension === 'txt') {
							contentType = 'text/plain';
						}

						// Upload with draft structure: {schoolId}/{timetableId}/{timetableDraftId}/output/{fileName}
						const outputObjectKey = `${schoolId}/${timetableId}/${timetableDraftId}/output/${fileName}`;
						await uploadBufferHelper(
							Buffer.from(fileContent, 'utf-8'),
							'schools',
							outputObjectKey,
							contentType
						);
					} catch (fileError) {
						console.warn(`   ⚠️  Failed to upload file ${filePath}:`, fileError);
					}
				}

				// Process database files if both are available
				if (timetableCSV) {
					try {
						await parseTimetableCSVAndPopulate(
							timetableCSV,
							queueEntry.timetableId,
							queueEntry.timetableDraftId
						);

						await parseTimetableCSVAndPopulateClasses(
							timetableCSV,
							queueEntry.timetableId,
							queueEntry.timetableDraftId
						);

						await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.completed);
					} catch (dbError) {
						console.error('📊 [DATABASE PROCESSOR] Database error details:', {
							message: dbError instanceof Error ? dbError.message : 'Unknown database error',
							stack: dbError instanceof Error ? dbError.stack : undefined,
							timetableId: timetableId
						});
					}
				} else {
					throw new Error('FET processing completed but no output files were generated');
				}
			} else {
				throw new Error('FET processing completed but no output files were generated');
			}
		} catch (processingError) {
			// Capture and store the error message in the draft
			const errorMessage =
				processingError instanceof Error ? processingError.message : 'Unknown error';

			// Store error message in draft if not already stored
			await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.failed);
			console.error('❌ [TIMETABLE PROCESSOR] Error during timetable processing:', processingError);

			// Extract error details from the error object
			const errorDetails =
				processingError && typeof processingError === 'object' && 'stdout' in processingError
					? String(processingError.stdout)
					: errorMessage;

			await updateTimetableDraftError(queueEntry.timetableDraftId, errorDetails);

			// Mark task as failed
			console.log('💥 [TIMETABLE PROCESSOR] Marking task as failed...');
			await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.failed, new Date());

			// Attempt cleanup even on failure
			try {
				const containerTempPath = `/tmp/${queueEntry.id}_${queueEntry.fileName}`;
				const containerOutputDir = `/tmp/output_${queueEntry.id}`;
				await performCleanup(containerTempPath, containerOutputDir);
			} catch (cleanupError) {
				console.error(
					'🧹 [TIMETABLE PROCESSOR] Cleanup failed after processing error:',
					cleanupError
				);
			}
		}
	} catch (error) {
		console.error('❌ [TIMETABLE PROCESSOR] Critical error in processTimetableQueue:', error);
	} finally {
		const totalTime = Date.now() - startTime;
		console.log(
			`⏱️  [TIMETABLE PROCESSOR] Process completed in ${(totalTime / 1000).toFixed(2)} seconds`
		);
	}
}

async function performCleanup(containerTempPath: string, containerOutputDir: string) {
	console.log('🧹 [CLEANUP] Starting cleanup operations...');

	// Container cleanup using FETDockerService
	await fetService.removeFile(containerTempPath);
	console.log('✅ [CLEANUP] Container input file removed');

	await fetService.removeDirectory(containerOutputDir);
	console.log('✅ [CLEANUP] Container output directory removed');

	console.log('🧹 [CLEANUP] Cleanup operations completed');
}
