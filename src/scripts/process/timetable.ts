import { queueStatusEnum } from '$lib/enums.js';
import {
	getInProgressTimetableQueues,
	getOldestQueuedTimetable,
	updateTimetableDraftError,
	updateTimetableDraftFetResponse,
	updateTimetableQueueStatus
} from '$lib/server/db/service/index.js';
import { getFileFromStorage, uploadBufferHelper } from '$lib/server/obj.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { parseTimetableCSVAndPopulate } from '../utils';

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

			// Stream file directly to Docker container using stdin
			console.log('📤 [TIMETABLE PROCESSOR] Streaming input file to Docker container...');
			await streamToDockerContainer('eddi-fet-1', containerTempPath, fileBuffer);
			console.log('✅ [TIMETABLE PROCESSOR] Input file streamed to container');

			// Create output directory in container
			console.log('📁 [TIMETABLE PROCESSOR] Creating output directory in container...');
			await execAsync(`docker exec eddi-fet-1 mkdir -p ${containerOutputDir}`, {
				timeout: 1 * 60 * 1000 // 1 minute
			});
			console.log('✅ [TIMETABLE PROCESSOR] Output directory created in container');

			// Run FET processing in Docker container
			const params = {
				htmllevel: 7,
				writetimetableconflicts: true,
				writetimetablesstatistics: true,
				writetimetablesxml: true,
				writetimetablesdayshorizontal: true,
				writetimetablesdaysvertical: true,
				writetimetablestimehorizontal: true,
				writetimetablestimevertical: true,
				writetimetablessubgroups: true,
				writetimetablesgroups: true,
				writetimetablesyears: true,
				writetimetablesteachers: true,
				writetimetablesteachersfreeperiods: true,
				writetimetablesrooms: true,
				writetimetablessubjects: true,
				writetimetablesactivitytags: true,
				writetimetablesactivities: true,
				exportcsv: true
			};

			// Build command string from params
			const cmd_str = Object.entries(params)
				.map(([key, value]) => `--${key}=${value}`)
				.join(' ');

			console.log('⚙️  [TIMETABLE PROCESSOR] Starting FET processing...');
			const command = `docker exec eddi-fet-1 fet-cl --inputfile="${containerTempPath}" --outputdir="${containerOutputDir}" ${cmd_str}`;

			console.log(`   - Command: ${command}`);

			const fetStartTime = Date.now();

			const fetResult = await execAsync(command, {
				timeout: 20 * 60 * 1000 // 20 minutes
			});

			const fetEndTime = Date.now();
			console.log(
				`✅ [TIMETABLE PROCESSOR] FET processing completed in ${(fetEndTime - fetStartTime) / 1000} seconds`
			);

			// Store FET response (stdout) in the draft for successful generations
			if (fetResult.stdout) {
				try {
					await updateTimetableDraftFetResponse(queueEntry.timetableDraftId, fetResult.stdout);
					console.log('✅ [TIMETABLE PROCESSOR] FET response stored in draft');
				} catch (responseError) {
					console.warn('⚠️  [TIMETABLE PROCESSOR] Failed to store FET response:', responseError);
				}
			}

			// List output files in container
			console.log('📋 [TIMETABLE PROCESSOR] Listing generated output files in container...');
			const listCommand = `docker exec eddi-fet-1 find ${containerOutputDir} -type f`;
			const listResult = await execAsync(listCommand, { timeout: 60000 });
			console.log('📋 [TIMETABLE PROCESSOR] Container output files:');
			console.log('--&*-');
			console.log(listResult.stdout);

			// Upload ALL generated files to object storage
			if (listResult.stdout.trim()) {
				const allFiles = listResult.stdout.trim().split('\n');
				console.log(
					`📤 [TIMETABLE PROCESSOR] Found ${allFiles.length} output files, uploading ALL to object storage...`
				);

				// Track specific files for database processing
				let timetableCSV = '';

				for (const filePath of allFiles) {
					try {
						const fileName = filePath.split('/').pop() || 'unknown';
						const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

						console.log(`   📄 Processing file: ${fileName}`);

						// Read file content from container
						const catCommand = `docker exec eddi-fet-1 cat "${filePath}"`;
						const fileContent = await execAsync(catCommand, { timeout: 2 * 60 * 1000 });

						// Check for specific files needed for database processing (suffix match)
						if (fileName.endsWith('timetable.csv')) {
							timetableCSV = fileContent.stdout;
							console.log(`   🎯 Found database processing file: ${fileName}`);
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
							Buffer.from(fileContent.stdout, 'utf-8'),
							'schools',
							outputObjectKey,
							contentType
						);
						console.log(`   ✅ Uploaded: ${outputObjectKey} (${contentType})`);
					} catch (fileError) {
						console.warn(`   ⚠️  Failed to upload file ${filePath}:`, fileError);
					}
				}
				console.log(
					`✅ [TIMETABLE PROCESSOR] All ${allFiles.length} output files uploaded to object storage`
				);

				// Process database files if both are available
				if (timetableCSV) {
					console.log('🔄 [DATABASE PROCESSOR] Processing FET output files for database...');
					try {
						console.log('📋 [DATABASE PROCESSOR] Starting CSV parsing and validation...');
						await parseTimetableCSVAndPopulate(
							timetableCSV,
							queueEntry.timetableId,
							queueEntry.timetableDraftId
						);

						console.log(
							'✅ [DATABASE PROCESSOR] FET activities successfully processed and stored in database'
						);

						await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.completed);
					} catch (dbError) {
						console.error(
							'❌ [DATABASE PROCESSOR] Error processing FET files for database:',
							dbError
						);
						console.error('📊 [DATABASE PROCESSOR] Database error details:', {
							message: dbError instanceof Error ? dbError.message : 'Unknown database error',
							stack: dbError instanceof Error ? dbError.stack : undefined,
							timetableId: timetableId
						});
						// Don't fail the entire process for database errors, just log them
					}
				} else {
					console.warn('⚠️  [DATABASE PROCESSOR] Missing required files for database processing:');
					console.warn(`   - timetable.fet: ${timetableCSV ? '✅ Found' : '❌ Missing'}`);
					throw new Error('FET processing completed but no output files were generated');
				}
			} else {
				console.log('📄 [TIMETABLE PROCESSOR] No output files found');
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

			console.error('📊 [TIMETABLE PROCESSOR] Error details:', {
				message: errorMessage,
				stack: processingError instanceof Error ? processingError.stack : undefined,
				queueEntryId: queueEntry.id,
				schoolId: queueEntry.school.id,
				timetableId: queueEntry.timetableId,
				timetableDraftId: queueEntry.timetableDraftId,
				fileName: queueEntry.fileName
			});

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
		console.error('📊 [TIMETABLE PROCESSOR] Critical error details:', {
			message: error instanceof Error ? error.message : 'Unknown critical error',
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString()
		});
	} finally {
		const totalTime = Date.now() - startTime;
		console.log(
			`⏱️  [TIMETABLE PROCESSOR] Process completed in ${(totalTime / 1000).toFixed(2)} seconds`
		);
	}
}

async function performCleanup(containerTempPath: string, containerOutputDir: string) {
	console.log('🧹 [CLEANUP] Starting cleanup operations...');

	// Container cleanup only (no local files to clean)
	try {
		await execAsync(`docker exec eddi-fet-1 rm -f ${containerTempPath}`, { timeout: 60000 });
		console.log('✅ [CLEANUP] Container input file removed');
	} catch (error) {
		console.warn('⚠️  [CLEANUP] Failed to remove container input file:', error);
	}

	try {
		await execAsync(`docker exec eddi-fet-1 rm -rf ${containerOutputDir}`, { timeout: 60000 });
		console.log('✅ [CLEANUP] Container output directory removed');
	} catch (error) {
		console.warn('⚠️  [CLEANUP] Failed to remove container output directory:', error);
	}

	console.log('🧹 [CLEANUP] Cleanup operations completed');
}

// Helper function to stream data directly to Docker container
async function streamToDockerContainer(
	containerName: string,
	targetPath: string,
	data: Buffer
): Promise<void> {
	return new Promise((resolve, reject) => {
		// Use docker exec with bash to write stdin to file
		const dockerProcess = spawn('docker', [
			'exec',
			'-i',
			containerName,
			'sh',
			'-c',
			`cat > ${targetPath}`
		]);

		let stderr = '';

		dockerProcess.stderr.on('data', (chunk) => {
			stderr += chunk.toString();
		});

		dockerProcess.on('error', (error) => {
			reject(new Error(`Failed to spawn docker process: ${error.message}`));
		});

		dockerProcess.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Docker process exited with code ${code}. stderr: ${stderr}`));
			}
		});

		// Write data to stdin and close
		dockerProcess.stdin.write(data);
		dockerProcess.stdin.end();
	});
}

const execPromise = promisify(exec);

async function execAsync(command: string, options: { timeout: number }) {
	return await execPromise(command, options);
}
