import { queueStatusEnum } from '$lib/enums.js';
import {
	createTimetableFETActivitiesFromFETExport,
	getInProgressTimetableQueues,
	getOldestQueuedTimetable,
	updateTimetableQueueStatus
} from '$lib/server/db/service/index.js';
import { getFileFromStorage } from '$lib/server/obj.js';
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

			// Copy file to Docker container
			const containerTempPath = `/tmp/${queueEntry.id}_${fileName}`;
			const containerOutputDir = `/tmp/output_${queueEntry.id}`;

			// Copy input file to container
			await execAsync(`docker cp "${tempFilePath}" eddi-fet-1:${containerTempPath}`, {
				timeout: 5 * 60 * 1000 // 5 minutes
			});

			// Create output directory in container
			await execAsync(`docker exec eddi-fet-1 mkdir -p ${containerOutputDir}`, {
				timeout: 1 * 60 * 1000 // 1 minute
			});

			// Run FET in Docker container
			const command = `docker exec eddi-fet-1 fet-cl --inputfile="${containerTempPath}" --outputdir="${containerOutputDir}" --htmllevel=7`;

			await execAsync(command, {
				timeout: 20 * 60 * 1000 // 20 minutes
			});

			// Copy output files back from container
			await execAsync(`docker cp eddi-fet-1:${containerOutputDir}/. "${outputDir}/"`, {
				timeout: 5 * 60 * 1000 // 5 minutes
			});

			const outputFiles = await fs.readdir(outputDir);
			console.log('FET output files generated:', outputFiles);

			const fetFile = outputFiles.find((file) => file.endsWith('.fet'));
			console.log('Selected FET file:', fetFile);

			if (outputFiles.length > 0 && fetFile) {
				// Read the FET output file content
				const fetFilePath = `${outputDir}/${fetFile}`;
				const fetFileContent = await fs.readFile(fetFilePath, 'utf-8');
				console.log('FET file content length:', fetFileContent.length);

				const data = processFETOutput(fetFileContent);
				await createTimetableFETActivitiesFromFETExport(queueEntry.timetableId, data);

				// Mark as completed
				await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.completed, new Date());

				// Cleanup temp files after successful processing
				try {
					await fs.unlink(tempFilePath);
					await fs.rm(outputDir, { recursive: true, force: true });

					// Cleanup Docker container temp files
					const containerTempPath = `/tmp/${queueEntry.id}_${fileName}`;
					const containerOutputDir = `/tmp/output_${queueEntry.id}`;
					await execAsync(`docker exec eddi-fet-1 rm -f ${containerTempPath}`, { timeout: 60000 });
					await execAsync(`docker exec eddi-fet-1 rm -rf ${containerOutputDir}`, {
						timeout: 60000
					});
				} catch {
					// Ignore cleanup errors
				}
			} else {
				console.warn('Warning: No FET output file found, but execution completed without error');
				await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.failed, new Date());
			}
		} catch (processingError) {
			console.error('Error processing timetable:', processingError);

			await updateTimetableQueueStatus(queueEntry.id, queueStatusEnum.failed, new Date());

			// Cleanup local temp files
			try {
				const tempFilePath = join(TEMP_DIR, `${queueEntry.id}_${queueEntry.fileName}`);
				await fs.unlink(tempFilePath);
				const outputDir = join(TEMP_DIR, `output_${queueEntry.id}`);
				await fs.rm(outputDir, { recursive: true, force: true });
			} catch {
				// Ignore cleanup errors
			}

			// Cleanup Docker container temp files
			try {
				const containerTempPath = `/tmp/${queueEntry.id}_${queueEntry.fileName}`;
				const containerOutputDir = `/tmp/output_${queueEntry.id}`;
				await execAsync(`docker exec eddi-fet-1 rm -f ${containerTempPath}`, { timeout: 60000 });
				await execAsync(`docker exec eddi-fet-1 rm -rf ${containerOutputDir}`, { timeout: 60000 });
			} catch {
				// Ignore cleanup errors
			}
		}
	} catch (error) {
		console.error('Error in processTimetableQueue:', error);
	}
}
const execPromise = promisify(exec);

async function execAsync(command: string, options: { timeout: number }) {
	return await execPromise(command, options);
}
