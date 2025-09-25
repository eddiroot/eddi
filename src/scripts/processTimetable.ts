import { queueStatusEnum } from '$lib/enums.js';
import {
	createTimetableFETActivitiesFromFETExport,
	getInProgressTimetableQueues,
	getOldestQueuedTimetable,
	updateTimetableQueueStatus
} from '$lib/server/db/service/index.js';
import { generateUniqueFileName, getFileFromStorage, uploadBufferHelper } from '$lib/server/obj.js';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { processFETOutput } from '../routes/admin/timetables/[timetableId]/generate/utils';

const TEMP_DIR = join(process.cwd(), 'temp');

async function ensureTempDir() {
	try {
		await fs.access(TEMP_DIR);
	} catch {
		await fs.mkdir(TEMP_DIR, { recursive: true });
	}
}

export async function processTimetableQueue() {
	const startTime = Date.now();
	console.log(
		'🚀 [TIMETABLE PROCESSOR] Starting timetable processing queue at',
		new Date().toISOString()
	);

	try {
		// Check for existing in-progress tasks
		console.log('🔍 [TIMETABLE PROCESSOR] Checking for existing in-progress tasks...');
		const inProgressQueues = await getInProgressTimetableQueues();
		if (inProgressQueues.length > 0) {
			console.log(
				`⚠️  [TIMETABLE PROCESSOR] Found ${inProgressQueues.length} in-progress tasks. Skipping new task.`
			);
			return;
		}
		console.log('✅ [TIMETABLE PROCESSOR] No in-progress tasks found. Proceeding...');

		// Get the oldest queued task
		console.log('🔍 [TIMETABLE PROCESSOR] Fetching oldest queued timetable task...');
		const queueEntry = await getOldestQueuedTimetable();
		if (!queueEntry) {
			console.log('📭 [TIMETABLE PROCESSOR] No queued timetables found. Nothing to process.');
			return;
		}
		console.log(
			`📋 [TIMETABLE PROCESSOR] Found queued task - ID: ${queueEntry.id}, School: ${queueEntry.school.id}, File: ${queueEntry.fileName}`
		);

		// Mark task as in progress
		console.log(`🔄 [TIMETABLE PROCESSOR] Marking task ${queueEntry.id} as in progress...`);
		await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.inProgress);
		console.log('✅ [TIMETABLE PROCESSOR] Task status updated to in progress');

		try {
			await ensureTempDir();
			console.log('📁 [TIMETABLE PROCESSOR] Temporary directory ensured');

			const schoolId = queueEntry.school.id.toString();
			const fileName = queueEntry.fileName;

			console.log('📥 [TIMETABLE PROCESSOR] Downloading input file from object storage...');
			console.log(`   - School ID: ${schoolId}`);
			console.log(`   - File name: ${fileName}`);

			const fileBuffer = await getFileFromStorage(schoolId, fileName);
			console.log(
				`✅ [TIMETABLE PROCESSOR] File downloaded successfully - Size: ${fileBuffer.length} bytes`
			);

			// Create temporary file for Docker processing
			const tempFilePath = join(TEMP_DIR, `${queueEntry.id}_${fileName}`);
			console.log(`💾 [TIMETABLE PROCESSOR] Writing file to temporary location: ${tempFilePath}`);
			await fs.writeFile(tempFilePath, fileBuffer);
			console.log('✅ [TIMETABLE PROCESSOR] File written to temporary location');

			// Docker container paths
			const containerTempPath = `/tmp/${queueEntry.id}_${fileName}`;
			const containerOutputDir = `/tmp/output_${queueEntry.id}`;

			console.log('🐳 [TIMETABLE PROCESSOR] Starting Docker operations...');
			console.log(`   - Container input path: ${containerTempPath}`);
			console.log(`   - Container output directory: ${containerOutputDir}`);

			// Copy input file to Docker container
			console.log('📤 [TIMETABLE PROCESSOR] Copying input file to Docker container...');
			await execAsync(`docker cp "${tempFilePath}" eddi-fet-1:${containerTempPath}`, {
				timeout: 5 * 60 * 1000 // 5 minutes
			});
			console.log('✅ [TIMETABLE PROCESSOR] Input file copied to container');

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

			console.log('⚙️  [TIMETABLE PROCESSOR] Starting FET processing...');
			const command = `docker exec eddi-fet-1 fet-cl --inputfile="${containerTempPath}" --outputdir="${containerOutputDir}" --htmllevel=7 --exportcsv=${params.writetimetableconflicts}`;

			console.log(`   - Command: ${command}`);

			const fetStartTime = Date.now();
			await execAsync(command, {
				timeout: 20 * 60 * 1000 // 20 minutes
			});
			const fetEndTime = Date.now();
			console.log(
				`✅ [TIMETABLE PROCESSOR] FET processing completed in ${(fetEndTime - fetStartTime) / 1000} seconds`
			);

			// List output files in container
			console.log('📋 [TIMETABLE PROCESSOR] Listing generated output files in container...');
			const listCommand = `docker exec eddi-fet-1 ls -la ${containerOutputDir}`;
			const listResult = await execAsync(listCommand, { timeout: 60000 });
			console.log('📋 [TIMETABLE PROCESSOR] Container output files:');
			console.log(listResult.stdout);

			// Find and process FET output file
			console.log('🔍 [TIMETABLE PROCESSOR] Searching for FET output file...');
			const findFetCommand = `docker exec eddi-fet-1 find ${containerOutputDir} -name "*.fet" -type f`;
			const findResult = await execAsync(findFetCommand, { timeout: 60000 });

			if (!findResult.stdout.trim()) {
				throw new Error('No FET output file (.fet) found in container output directory');
			}

			const containerFetFilePath = findResult.stdout.trim().split('\n')[0]; // Take first .fet file
			console.log(`✅ [TIMETABLE PROCESSOR] Found FET output file: ${containerFetFilePath}`);

			// Copy FET file content from container
			console.log('📥 [TIMETABLE PROCESSOR] Reading FET output file from container...');
			const catCommand = `docker exec eddi-fet-1 cat "${containerFetFilePath}"`;
			const catResult = await execAsync(catCommand, { timeout: 2 * 60 * 1000 });
			const fetFileContent = catResult.stdout;
			console.log(
				`✅ [TIMETABLE PROCESSOR] FET file content read - Length: ${fetFileContent.length} characters`
			);

			// Store FET output file in object storage
			console.log('☁️  [TIMETABLE PROCESSOR] Uploading FET output to object storage...');
			const outputFileName = generateUniqueFileName(`timetable_${queueEntry.id}_output.fet`);
			const outputObjectKey = `${schoolId}/outputs/${outputFileName}`;

			await uploadBufferHelper(
				Buffer.from(fetFileContent, 'utf-8'),
				'schools',
				outputObjectKey,
				'application/xml'
			);
			console.log(
				`✅ [TIMETABLE PROCESSOR] FET output uploaded to object storage: ${outputObjectKey}`
			);

			// Check if there are HTML output files to store
			console.log('🔍 [TIMETABLE PROCESSOR] Searching for HTML output files...');
			const findHtmlCommand = `docker exec eddi-fet-1 find ${containerOutputDir} -name "*.html" -type f`;
			const htmlResult = await execAsync(findHtmlCommand, { timeout: 60000 });

			if (htmlResult.stdout.trim()) {
				const htmlFiles = htmlResult.stdout.trim().split('\n');
				console.log(
					`📄 [TIMETABLE PROCESSOR] Found ${htmlFiles.length} HTML output files, uploading to object storage...`
				);

				for (const htmlFilePath of htmlFiles) {
					try {
						const htmlFileName = htmlFilePath.split('/').pop() || 'unknown.html';
						const htmlCatCommand = `docker exec eddi-fet-1 cat "${htmlFilePath}"`;
						const htmlContent = await execAsync(htmlCatCommand, { timeout: 60000 });

						const htmlOutputKey = `${schoolId}/outputs/${queueEntry.id}_${htmlFileName}`;
						await uploadBufferHelper(
							Buffer.from(htmlContent.stdout, 'utf-8'),
							'schools',
							htmlOutputKey,
							'text/html'
						);
						console.log(`   ✅ Uploaded: ${htmlOutputKey}`);
					} catch (htmlError) {
						console.warn(`   ⚠️  Failed to upload HTML file ${htmlFilePath}:`, htmlError);
					}
				}
			} else {
				console.log('📄 [TIMETABLE PROCESSOR] No HTML output files found');
			}

			// Process FET output data for database storage
			console.log('🔄 [TIMETABLE PROCESSOR] Processing FET output data...');
			const data = processFETOutput(fetFileContent);
			console.log(
				`✅ [TIMETABLE PROCESSOR] FET output processed - Found ${data.length} activities`
			);

			// Store processed data in database
			console.log('💾 [TIMETABLE PROCESSOR] Storing processed data in database...');
			await createTimetableFETActivitiesFromFETExport(queueEntry.timetableId, data);
			console.log('✅ [TIMETABLE PROCESSOR] Data stored in database successfully');

			// Mark task as completed
			console.log('🎉 [TIMETABLE PROCESSOR] Marking task as completed...');
			await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.completed, new Date());

			const totalTime = Date.now() - startTime;
			console.log(
				`🎉 [TIMETABLE PROCESSOR] Task ${queueEntry.id} completed successfully in ${(totalTime / 1000).toFixed(2)} seconds`
			);

			// Cleanup temporary files
			console.log('🧹 [TIMETABLE PROCESSOR] Starting cleanup...');
			await performCleanup(
				queueEntry.id,
				queueEntry.fileName,
				tempFilePath,
				containerTempPath,
				containerOutputDir
			);
		} catch (processingError) {
			console.error('❌ [TIMETABLE PROCESSOR] Error during timetable processing:', processingError);
			console.error('📊 [TIMETABLE PROCESSOR] Error details:', {
				message: processingError instanceof Error ? processingError.message : 'Unknown error',
				stack: processingError instanceof Error ? processingError.stack : undefined,
				queueEntryId: queueEntry.id,
				schoolId: queueEntry.school.id,
				fileName: queueEntry.fileName
			});

			// Mark task as failed
			console.log('💥 [TIMETABLE PROCESSOR] Marking task as failed...');
			await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.failed, new Date());

			// Attempt cleanup even on failure
			try {
				const tempFilePath = join(TEMP_DIR, `${queueEntry.id}_${queueEntry.fileName}`);
				const containerTempPath = `/tmp/${queueEntry.id}_${queueEntry.fileName}`;
				const containerOutputDir = `/tmp/output_${queueEntry.id}`;
				await performCleanup(
					queueEntry.id,
					queueEntry.fileName,
					tempFilePath,
					containerTempPath,
					containerOutputDir
				);
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

async function performCleanup(
	queueId: number,
	fileName: string,
	tempFilePath: string,
	containerTempPath: string,
	containerOutputDir: string
) {
	console.log('🧹 [CLEANUP] Starting cleanup operations...');

	// Local file cleanup
	try {
		await fs.unlink(tempFilePath);
		console.log('✅ [CLEANUP] Local temporary file removed');
	} catch (error) {
		console.warn('⚠️  [CLEANUP] Failed to remove local temporary file:', error);
	}

	// Container cleanup
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
const execPromise = promisify(exec);

async function execAsync(command: string, options: { timeout: number }) {
	return await execPromise(command, options);
}
