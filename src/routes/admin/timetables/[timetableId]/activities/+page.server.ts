import { userTypeEnum, yearLevelEnum } from '$lib/enums.js';
import {
	createTimetableDraftActivityWithRelations,
	deleteTimetableDraftActivity,
	getActivityGroupsByActivityId,
	getActivityLocationsByActivityId,
	getActivityStudentsByActivityId,
	getActivityTeachersByActivityId,
	getActivityYearsByActivityId,
	getSpacesBySchoolId,
	getStudentsForTimetable,
	getSubjectsBySchoolIdAndYearLevel,
	getTimetableActivitiesByTimetableDraftId,
	getTimetableStudentGroupsByTimetableDraftId,
	getUsersBySchoolIdAndType
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';

type EnrichedActivity = Awaited<
	ReturnType<typeof getTimetableActivitiesByTimetableDraftId>
>[number] & {
	teacherIds: string[];
	yearLevels: string[];
	groupIds: number[];
	studentIds: string[];
	locationIds: number[];
};

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId, 10);

	const teachers = await getUsersBySchoolIdAndType(user.schoolId, userTypeEnum.teacher);
	const baseActivities = await getTimetableActivitiesByTimetableDraftId(timetableId);
	const spaces = await getSpacesBySchoolId(user.schoolId);
	const students = await getStudentsForTimetable(timetableId, user.schoolId);

	const groups = await getTimetableStudentGroupsByTimetableDraftId(timetableId);

	const defaultYearLevel = groups.length > 0 ? groups[0].yearLevel : yearLevelEnum.year9;

	const yearLevels = groups
		.map((group) => group.yearLevel)
		.filter((value, index, self) => self.indexOf(value) === index);

	// Get subjects for all year levels
	const subjectsByYearLevel: Record<
		string,
		Awaited<ReturnType<typeof getSubjectsBySchoolIdAndYearLevel>>
	> = {};
	for (const yearLevel of yearLevels) {
		subjectsByYearLevel[yearLevel] = await getSubjectsBySchoolIdAndYearLevel(
			user.schoolId,
			yearLevel
		);
	}

	// Enrich activities with all related data
	const activities: EnrichedActivity[] = await Promise.all(
		baseActivities.map(async (activity) => {
			const [teachers, locations, students, groups, years] = await Promise.all([
				getActivityTeachersByActivityId(activity.id),
				getActivityLocationsByActivityId(activity.id),
				getActivityStudentsByActivityId(activity.id),
				getActivityGroupsByActivityId(activity.id),
				getActivityYearsByActivityId(activity.id)
			]);

			return {
				...activity,
				teacherIds: teachers.map((t) => t.id),
				locationIds: locations.map((l) => l.id),
				studentIds: students.map((s) => s.id),
				groupIds: groups.map((g) => g.id),
				yearLevels: years.map((y) => y.yearLevel)
			};
		})
	);

	const activitiesBySubjectId = activities.reduce(
		(acc, activity) => {
			if (!acc[activity.subjectId]) {
				acc[activity.subjectId] = [];
			}
			acc[activity.subjectId].push(activity);
			return acc;
		},
		{} as Record<number, typeof activities>
	);

	return {
		timetableId,
		defaultYearLevel,
		yearLevels,
		groups,
		teachers,
		students,
		spaces,
		activitiesBySubjectId,
		subjectsByYearLevel
	};
};

export const actions = {
	createActivity: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId, 10);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		try {
			const formData = await request.formData();
			const subjectId = formData.get('subjectId');
			const teacherIds = formData.getAll('teacherIds');
			const yearLevels = formData.getAll('yearLevels');
			const groupIds = formData.getAll('groupIds');
			const studentIds = formData.getAll('studentIds');
			const locationIds = formData.getAll('locationIds');
			const numInstancesPerWeek = formData.get('numInstancesPerWeek');
			const periodsPerInstance = formData.get('periodsPerInstance');

			// Validate required fields
			if (!subjectId || !teacherIds || teacherIds.length === 0) {
				return fail(400, { error: 'Subject and at least one teacher are required' });
			}

			if (!numInstancesPerWeek || !periodsPerInstance) {
				return fail(400, { error: 'Instances per week and periods per instance are required' });
			}

			// Validate that at least one assignment level is specified
			if (
				(!yearLevels || yearLevels.length === 0) &&
				(!groupIds || groupIds.length === 0) &&
				(!studentIds || studentIds.length === 0)
			) {
				return fail(400, {
					error: 'At least one of year levels, groups, or students must be specified'
				});
			}

			// Create the activity with all relations
			await createTimetableDraftActivityWithRelations({
				timetableDraftId,
				subjectId: parseInt(subjectId as string, 10),
				teacherIds: teacherIds as string[],
				yearLevels: yearLevels as string[],
				groupIds: groupIds.map((id) => parseInt(id as string, 10)),
				studentIds: studentIds as string[],
				preferredSpaceIds: locationIds.map((id) => parseInt(id as string, 10)),
				periodsPerInstance: parseInt(periodsPerInstance as string),
				instancesPerWeek: parseInt(numInstancesPerWeek as string)
			});

			return { success: true };
		} catch (error) {
			console.error('Error creating activity:', error);
			return fail(500, { error: 'Failed to create activity. Please try again.' });
		}
	},

	editActivity: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		try {
			const formData = await request.formData();
			const activityId = formData.get('activityId');
			const subjectId = formData.get('subjectId');
			const teacherIds = formData.getAll('teacherIds');
			const yearLevels = formData.getAll('yearLevels');
			const groupIds = formData.getAll('groupIds');
			const studentIds = formData.getAll('studentIds');
			const locationIds = formData.getAll('locationIds');
			const numInstancesPerWeek = formData.get('numInstancesPerWeek');
			const periodsPerInstance = formData.get('periodsPerInstance');

			// Validate required fields
			if (!activityId) {
				return fail(400, { error: 'Activity ID is required' });
			}

			if (!subjectId || !teacherIds || teacherIds.length === 0) {
				return fail(400, { error: 'Subject and at least one teacher are required' });
			}

			if (!numInstancesPerWeek || !periodsPerInstance) {
				return fail(400, { error: 'Instances per week and periods per instance are required' });
			}

			// Validate that at least one assignment level is specified
			if (
				(!yearLevels || yearLevels.length === 0) &&
				(!groupIds || groupIds.length === 0) &&
				(!studentIds || studentIds.length === 0)
			) {
				return fail(400, {
					error: 'At least one of year levels, groups, or students must be specified'
				});
			}

			// Delete the old activity (cascading deletes will handle junction tables)
			await deleteTimetableDraftActivity(parseInt(activityId as string, 10));

			// Create the new activity with updated relations
			await createTimetableDraftActivityWithRelations({
				timetableDraftId: timetableId,
				subjectId: parseInt(subjectId as string),
				teacherIds: teacherIds as string[],
				yearLevels: yearLevels as string[],
				groupIds: groupIds.map((id) => parseInt(id as string, 10)),
				studentIds: studentIds as string[],
				preferredSpaceIds: locationIds.map((id) => parseInt(id as string, 10)),
				periodsPerInstance: parseInt(periodsPerInstance as string),
				instancesPerWeek: parseInt(numInstancesPerWeek as string)
			});

			return { success: true };
		} catch (error) {
			console.error('Error editing activity:', error);
			return fail(500, { error: 'Failed to edit activity. Please try again.' });
		}
	},

	deleteActivity: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId, 10);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		try {
			const formData = await request.formData();
			const activityId = formData.get('activityId');

			if (!activityId) {
				return fail(400, { error: 'Activity ID is required' });
			}

			await deleteTimetableDraftActivity(parseInt(activityId as string, 10));

			return { success: true };
		} catch (error) {
			console.error('Error deleting activity:', error);
			return fail(500, { error: 'Failed to delete activity. Please try again.' });
		}
	}
};
