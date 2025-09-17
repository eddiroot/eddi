import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
	createTimetableFETActivitiesFromFETExport,
	getInProgressTimetableQueues,
	getOldestQueuedTimetable,
	updateTimetableQueueStatus
} from '$lib/server/db/service/timetables.js';
import { getFileFromStorage } from '$lib/server/obj.js';
import { queueStatusEnum } from '$lib/enums.js';
import { processFETOutput } from '../routes/admin/timetables/[timetableId]/generate/utils';

const execAsync = promisify(exec);

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
		const inProgressQueues = await getInProgressTimetableQueues();
		if (inProgressQueues.length > 0) return;

		const queueEntry = await getOldestQueuedTimetable();
		if (!queueEntry) return;

		await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.inProgress);

		try {
			await ensureTempDir();

			const schoolId = queueEntry.school.id.toString();
			const fileName = queueEntry.fileName;
			const fileBuffer = await getFileFromStorage(schoolId, fileName);

			const tempFilePath = join(TEMP_DIR, `${queueEntry.id}_${fileName}`);
			await fs.writeFile(tempFilePath, fileBuffer);

			const outputDir = join(TEMP_DIR, `output_${queueEntry.id}`);
			await fs.mkdir(outputDir, { recursive: true });

			const command = `fet-cl --inputfile="${tempFilePath}" --outputdir="${outputDir}" --htmllevel=7`;

			await execAsync(command, {
				timeout: 20 * 60 * 1000 // 20 minutes
			});

			const outputFiles = await fs.readdir(outputDir);
			const fetFile = outputFiles.find((file) => file.endsWith('.fet'));

			if (outputFiles.length > 0) {
				const data = processFETOutput(`${outputDir}/${fetFile}`);
				await createTimetableFETActivitiesFromFETExport(queueEntry.timetableId, data);
				await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.completed, new Date());
			} else {
				console.warn('Warning: No output files found, but fet-cl completed without error');
			}

			try {
				await fs.unlink(tempFilePath);
				await fs.rm(outputDir, { recursive: true, force: true });
			} catch (cleanupError) {
				console.warn('Warning: Could not clean up temporary files:', cleanupError);
			}
		} catch (processingError) {
			console.error('Error processing timetable:', processingError);

			await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.failed, new Date());

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
