import { userTypeEnum } from '$lib/enums.js';
import {
	getBuildingsBySchoolId,
	getSchoolById,
	getSpacesBySchoolId,
	getSubjectsBySchoolId,
	getUsersBySchoolIdAndType
} from '$lib/server/db/service/index.js';
import {
	createTimetableQueueEntry,
	getTimetableActivitiesByTimetableId,
	getTimetableDays,
	getTimetablePeriods,
	getTimetableStudentGroupsWithCountsByTimetableId
} from '$lib/server/db/service/timetables.js';
import { generateUniqueFileName, uploadBufferHelper } from '$lib/server/obj.js';
import { FETDockerService } from '$lib/server/services/fet-docker.js';
import { error, json } from '@sveltejs/kit';
import { processTimetableQueue } from '../../../../scripts/processTimetable.js';
import { buildFETInput } from '../../../admin/timetables/[timetableId]/generate/utils.js';

export async function POST({ request, locals }: { request: Request; locals: unknown }) {
	try {
		// Ensure user is authenticated and is a school admin
		const { security } = locals;
		security.isAuthenticated().isSchoolAdmin();

		const user = security.getUser();
		const requestData = await request.json();
		const { timetableId, fileName } = requestData;
		let { fetXmlContent } = requestData;

		// Validate inputs
		if (!timetableId || !fileName) {
			return error(400, {
				message: 'Missing required fields: timetableId and fileName'
			});
		}

		// If no FET XML content provided, generate it from timetable data
		if (!fetXmlContent || fetXmlContent.trim() === '') {
			try {
				const [
					timetableDays,
					timetablePeriods,
					studentGroups,
					activities,
					buildings,
					spaces,
					teachers,
					subjects,
					school
				] = await Promise.all([
					getTimetableDays(timetableId),
					getTimetablePeriods(timetableId),
					getTimetableStudentGroupsWithCountsByTimetableId(timetableId),
					getTimetableActivitiesByTimetableId(timetableId),
					getBuildingsBySchoolId(user.schoolId),
					getSpacesBySchoolId(user.schoolId),
					getUsersBySchoolIdAndType(user.schoolId, userTypeEnum.teacher),
					getSubjectsBySchoolId(user.schoolId),
					getSchoolById(user.schoolId)
				]);

				fetXmlContent = buildFETInput({
					timetableDays,
					timetablePeriods,
					studentGroups,
					activities,
					buildings,
					spaces,
					teachers,
					subjects,
					school,
					activeConstraints: []
				});
			} catch (buildError) {
				console.error('Error building FET input:', buildError);
				return error(500, {
					message:
						'Failed to generate timetable data. Please ensure all required data is configured.'
				});
			}
		}

		// Check if FET Docker container is running
		const fetService = new FETDockerService();
		const isRunning = await fetService.isContainerRunning();

		if (!isRunning) {
			return error(503, {
				message: 'FET service is not available. Please contact your system administrator.'
			});
		}

		// Upload the FET XML content to storage for queue processing
		const uniqueFileName = generateUniqueFileName(fileName);
		const objectKey = `${user.schoolId}/${uniqueFileName}`;

		await uploadBufferHelper(
			Buffer.from(fetXmlContent, 'utf-8'),
			'schools',
			objectKey,
			'application/xml'
		);

		// Add to queue
		await createTimetableQueueEntry(timetableId, user.id, uniqueFileName);

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
}

export async function GET({ locals }: { locals: unknown }) {
	try {
		const { security } = locals;
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
}
