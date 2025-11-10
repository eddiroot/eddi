import { createTimetableDraftFETActivitiesFromFETExport } from '$lib/server/db/service/index.js';
import { getFileFromStorage, listFiles } from '$lib/server/obj.js';
import { processFETOutput } from '../../../routes/admin/timetables/[timetableId]/generate/utils.js';

/**
 * Retrieves and processes FET output files from object storage
 * This should be called as a separate step after the raw files are uploaded
 */
export async function processTimetableOutputFiles(
	schoolId: string,
	timetableId: string
): Promise<{ success: boolean; message: string; filesProcessed: number }> {
	try {
		console.log('🔍 [OUTPUT PROCESSOR] Starting output file processing...');
		console.log(`   - School ID: ${schoolId}`);
		console.log(`   - Timetable ID: ${timetableId}`);

		// List all output files for this timetable
		const outputPrefix = `${schoolId}/${timetableId}/output/`;
		const outputFiles = await listFiles('schools', outputPrefix);
		console.log(`📋 [OUTPUT PROCESSOR] Found ${outputFiles.length} output files`);

		if (outputFiles.length === 0) {
			return {
				success: false,
				message: 'No output files found for processing',
				filesProcessed: 0
			};
		}

		// Find the main FET output file (.fet extension)
		const fetFile = outputFiles.find((file) => file.endsWith('.fet'));
		if (!fetFile) {
			return {
				success: false,
				message: 'No FET output file (.fet) found in uploaded files',
				filesProcessed: 0
			};
		}

		console.log(`✅ [OUTPUT PROCESSOR] Found FET output file: ${fetFile}`);

		// Download and process the FET file
		console.log('📥 [OUTPUT PROCESSOR] Downloading FET output file...');
		const fetBuffer = await getFileFromStorage('schools', fetFile);
		const fetContent = fetBuffer.toString('utf-8');
		console.log(
			`✅ [OUTPUT PROCESSOR] FET file downloaded - Size: ${fetContent.length} characters`
		);

		// Process the FET content
		console.log('🔄 [OUTPUT PROCESSOR] Processing FET output data...');
		const processedData = processFETOutput(fetContent);
		console.log(
			`✅ [OUTPUT PROCESSOR] FET output processed - Found ${processedData.length} activities`
		);

		// Store in database
		console.log('💾 [OUTPUT PROCESSOR] Storing processed data in database...');
		await createTimetableDraftFETActivitiesFromFETExport(parseInt(timetableId, 10), processedData);
		console.log('✅ [OUTPUT PROCESSOR] Data stored in database successfully');

		return {
			success: true,
			message: `Successfully processed ${outputFiles.length} files and stored ${processedData.length} activities`,
			filesProcessed: outputFiles.length
		};
	} catch (error) {
		console.error('❌ [OUTPUT PROCESSOR] Error processing output files:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Unknown error occurred',
			filesProcessed: 0
		};
	}
}

/**
 * Lists all available files for a specific timetable
 */
export async function getTimetableFiles(
	schoolId: string,
	timetableId: string
): Promise<{
	input: string[];
	output: string[];
}> {
	const inputPrefix = `${schoolId}/${timetableId}/input/`;
	const outputPrefix = `${schoolId}/${timetableId}/output/`;

	const [inputFiles, outputFiles] = await Promise.all([
		listFiles('schools', inputPrefix),
		listFiles('schools', outputPrefix)
	]);

	return {
		input: inputFiles.map((file) => file.replace(inputPrefix, '')),
		output: outputFiles.map((file) => file.replace(outputPrefix, ''))
	};
}

/**
 * Gets a specific file from timetable storage
 */
export async function getTimetableFile(
	schoolId: string,
	timetableId: string,
	fileType: 'input' | 'output',
	fileName: string
): Promise<Buffer> {
	const filePath = `${schoolId}/${timetableId}/${fileType}/${fileName}`;
	return await getFileFromStorage('schools', filePath);
}

/**
 * Gets all HTML output files for display purposes
 */
export async function getTimetableHTMLFiles(
	schoolId: string,
	timetableId: string
): Promise<Array<{ name: string; content: string }>> {
	const outputPrefix = `${schoolId}/${timetableId}/output/`;
	const outputFiles = await listFiles('schools', outputPrefix);

	const htmlFiles = outputFiles.filter((file) => file.endsWith('.html'));
	const results = [];

	for (const htmlFile of htmlFiles) {
		try {
			const buffer = await getFileFromStorage('schools', htmlFile);
			results.push({
				name: htmlFile.replace(outputPrefix, ''),
				content: buffer.toString('utf-8')
			});
		} catch (error) {
			console.warn(`Failed to load HTML file ${htmlFile}:`, error);
		}
	}

	return results;
}
