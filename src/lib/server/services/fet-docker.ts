import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

interface FETExecutionResult {
	success: boolean;
	outputFiles?: string[];
	error?: string;
	executionTime: number;
}

export class FETDockerService {
	private containerName = 'eddi-fet-1'; // Based on your docker-compose service name

	/**
	 * Execute FET timetabling in Docker container
	 */
	async executeFET(fetXmlContent: string): Promise<FETExecutionResult> {
		const startTime = Date.now();
		const jobId = randomUUID();
		const inputFileName = `input_${jobId}.fet`;
		const outputDir = `output_${jobId}`;

		try {
			// Write input file to container
			await this.writeFileToContainer(inputFileName, fetXmlContent);

			// Create output directory in container
			await this.createDirectoryInContainer(outputDir);

			// Execute FET command in container
			const fetCommand = `fet-cl --inputfile="/timetables/${inputFileName}" --outputdir="/output/${outputDir}" --htmllevel=7`;

			console.log(`Executing FET command: ${fetCommand}`);

			const { stdout, stderr } = await execAsync(
				`docker exec ${this.containerName} ${fetCommand}`,
				{ timeout: 20 * 60 * 1000 } // 20 minutes timeout
			);

			console.log('FET stdout:', stdout);
			if (stderr) {
				console.warn('FET stderr:', stderr);
			}

			// List output files
			const outputFiles = await this.listOutputFiles(outputDir);

			// Clean up input file
			await this.removeFileFromContainer(`/timetables/${inputFileName}`);

			return {
				success: true,
				outputFiles,
				executionTime: Date.now() - startTime
			};
		} catch (error) {
			console.error('FET execution error:', error);

			// Clean up on error
			try {
				await this.removeFileFromContainer(`/timetables/${inputFileName}`);
				await this.removeDirectoryFromContainer(`/output/${outputDir}`);
			} catch (cleanupError) {
				console.warn('Cleanup error:', cleanupError);
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				executionTime: Date.now() - startTime
			};
		}
	}

	/**
	 * Get output file content from container
	 */
	async getOutputFileContent(outputDir: string, fileName: string): Promise<string> {
		try {
			const { stdout } = await execAsync(
				`docker exec ${this.containerName} cat /output/${outputDir}/${fileName}`
			);
			return stdout;
		} catch (error) {
			throw new Error(`Failed to read output file: ${error}`);
		}
	}

	/**
	 * Clean up output directory in container
	 */
	async cleanupOutputDirectory(outputDir: string): Promise<void> {
		try {
			await this.removeDirectoryFromContainer(`/output/${outputDir}`);
		} catch (error) {
			console.warn(`Failed to cleanup output directory ${outputDir}:`, error);
		}
	}

	/**
	 * Check if FET container is running
	 */
	async isContainerRunning(): Promise<boolean> {
		try {
			const { stdout } = await execAsync(
				`docker inspect -f '{{.State.Running}}' ${this.containerName}`
			);
			return stdout.trim() === 'true';
		} catch (error) {
			console.error('Error checking container status:', error);
			return false;
		}
	}

	// Private helper methods

	private async writeFileToContainer(fileName: string, content: string): Promise<void> {
		// Create a temporary file on the host
		const tempFilePath = join('/tmp', fileName);
		await writeFile(tempFilePath, content);

		try {
			// Copy file to container
			await execAsync(`docker cp "${tempFilePath}" ${this.containerName}:/timetables/`);
		} finally {
			// Clean up temporary file
			await unlink(tempFilePath);
		}
	}

	private async createDirectoryInContainer(dirName: string): Promise<void> {
		await execAsync(`docker exec ${this.containerName} mkdir -p /output/${dirName}`);
	}

	private async removeFileFromContainer(filePath: string): Promise<void> {
		await execAsync(`docker exec ${this.containerName} rm -f "${filePath}"`);
	}

	private async removeDirectoryFromContainer(dirPath: string): Promise<void> {
		await execAsync(`docker exec ${this.containerName} rm -rf "${dirPath}"`);
	}

	private async listOutputFiles(outputDir: string): Promise<string[]> {
		try {
			const { stdout } = await execAsync(
				`docker exec ${this.containerName} find /output/${outputDir} -type f -name "*" | head -20`
			);

			return stdout
				.split('\n')
				.filter((line) => line.trim())
				.map((line) => line.replace(`/output/${outputDir}/`, ''));
		} catch {
			console.warn('Failed to list output files');
			return [];
		}
	}
}
