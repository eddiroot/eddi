import { createTimetableQueueEntry } from '$lib/server/db/service/timetables.js';
import { FETDockerService } from '$lib/server/services/fet-docker.js';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { processTimetableQueue } from '../../../../scripts/processTimetable.js';

export const POST: RequestHandler = async ({ locals: { security }, request }) => {
	security.isAuthenticated();
	try {
		// Ensure user is authenticated and is a school admin
		security.isAuthenticated().isSchoolAdmin();

		const user = security.getUser();
		const requestData = await request.json();
		const { timetableId, fileName } = requestData;
		const { fetXmlContent } = requestData;

		// Validate inputs
		if (!timetableId || !fileName) {
			return error(400, {
				message: 'Missing required fields: timetableId and fileName'
			});
		}

		// If no FET XML content provided, generate it from timetable data
		if (!fetXmlContent || fetXmlContent.trim() === '') {
			console.error('Error recieving FET input:' + error);
			return error(500, {
				message: 'Failed to generate timetable data. Please ensure all required data is configured.'
			});
		}

		// Check if FET Docker container is running
		const fetService = new FETDockerService();
		const isRunning = await fetService.isContainerRunning();

		if (!isRunning) {
			return error(503, {
				message: 'FET service is not available. Please contact your system administrator.'
			});
		}

		await createTimetableQueueEntry(timetableId, user.id, fileName);

		// Trigger processing (this will run asynchronously)
		processTimetableQueue().catch((err: Error) => {
			console.error('Error in timetable processing:', err);
		});

		return json({
			success: true,
			message: 'Timetable generation has been queued successfully',
			queuedAt: new Date().toISOString()
		});
	} catch (err) {
		console.error('Error queuing timetable generation:', err);
		return error(500, {
			message: 'Failed to queue timetable generation'
		});
	}
};

export const GET: RequestHandler = async ({ locals: { security } }) => {
	security.isAuthenticated();
	try {
		security.isAuthenticated().isSchoolAdmin();

		const fetService = new FETDockerService();
		const isRunning = await fetService.isContainerRunning();

		return json({
			serviceStatus: isRunning ? 'running' : 'stopped',
			available: isRunning
		});
	} catch (err) {
		console.error('Error checking FET service status:', err);
		return error(500, {
			message: 'Failed to check service status'
		});
	}
};
