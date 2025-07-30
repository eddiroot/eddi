import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
	getInProgressTimetableQueues,
	getOldestQueuedTimetable,
	updateTimetableQueueStatus
} from '$lib/server/db/service/timetables.js';
import { getFileFromStorage } from '$lib/server/obj.js';
import { queueStatusEnum } from '$lib/enums.js';

const execAsync = promisify(exec);

// Create a temp directory for processing files
const TEMP_DIR = join(process.cwd(), 'temp');

async function ensureTempDir() {
	try {
		await fs.access(TEMP_DIR);
	} catch {
		await fs.mkdir(TEMP_DIR, { recursive: true });
	}
}

export async function processTimetableQueue() {
	try {
		// Check if there are any timetables currently being processed
		const inProgressQueues = await getInProgressTimetableQueues();

		if (inProgressQueues.length > 0) {
			console.log(`${inProgressQueues.length} timetable(s) currently being processed. Skipping...`);
			return;
		}

		// Get the oldest queued timetable
		const queueEntry = await getOldestQueuedTimetable();

		if (!queueEntry) {
			console.log('No timetables in queue to process.');
			return;
		}

		console.log(
			`Processing timetable queue entry ${queueEntry.id} for timetable ${queueEntry.timetableId}`
		);

		// Update status to in progress
		await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.inProgress);

		try {
			// Ensure temp directory exists
			await ensureTempDir();

			const schoolId = queueEntry.school.id.toString();

			// Use the filename stored in the database
			const fileName = queueEntry.fileName;

			console.log(
				`Downloading file: ${fileName} for timetable ${queueEntry.timetableId} from school ${schoolId}`
			);

			// Download the XML file from object storage
			const fileBuffer = await getFileFromStorage(schoolId, fileName);

			// Save the file to temp directory
			const tempFilePath = join(TEMP_DIR, `${queueEntry.id}_${fileName}`);
			await fs.writeFile(tempFilePath, fileBuffer);

			console.log(`File saved to ${tempFilePath}`);

			// Execute fet-cl command to process the timetable
			console.log('Executing fet-cl to process timetable...');
			const outputDir = join(TEMP_DIR, `output_${queueEntry.id}`);

			// Create output directory
			await fs.mkdir(outputDir, { recursive: true });

			// Execute fet-cl command
			// Note: Adjust the fet-cl command based on your specific requirements
			const command = `fet-cl --inputfile="${tempFilePath}" --outputdir="${outputDir}" --htmllevel=7`;

			console.log(`Executing command: ${command}`);

			const { stdout, stderr } = await execAsync(command, {
				timeout: 300000 // 5 minute timeout
			});

			console.log('FET-CL stdout:', stdout);
			if (stderr) {
				console.log('FET-CL stderr:', stderr);
			}

			// Check if output was generated successfully
			const outputFiles = await fs.readdir(outputDir);
			console.log(`Generated output files: ${outputFiles.join(', ')}`);

			if (outputFiles.length > 0) {
				console.log('Timetable processing completed successfully');
				await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.completed, new Date());
			} else {
				console.log('Warning: No output files found, but fet-cl completed without error');
				await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.completed, new Date());
			}

			// Clean up temporary files
			try {
				await fs.unlink(tempFilePath);
				// Remove output directory and its contents
				await fs.rm(outputDir, { recursive: true, force: true });
				console.log('Temporary files cleaned up');
			} catch (cleanupError) {
				console.warn('Warning: Could not clean up temporary files:', cleanupError);
			}
		} catch (processingError) {
			console.error('Error processing timetable:', processingError);

			// Update status to failed
			await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.failed, new Date());

			// Clean up any temporary files that might exist
			try {
				const tempFilePath = join(TEMP_DIR, `${queueEntry.id}_${queueEntry.timetableId}.xml`);
				await fs.unlink(tempFilePath);
			} catch {
				// Ignore cleanup errors
			}
		}
	} catch (error) {
		console.error('Error in processTimetableQueue:', error);
	}
}
