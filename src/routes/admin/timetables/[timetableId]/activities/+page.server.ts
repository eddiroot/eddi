import {
	getSubjectsBySchoolIdAndYearLevel,
	getUsersBySchoolIdAndType,
	getTimetableStudentGroupsByTimetableId,
	getTimetableActivitiesByTimetableId,
	createTimetableActivity
} from '$lib/server/db/service';
import { activityFormSchema } from './schema.js';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { yearLevelEnum, userTypeEnum } from '$lib/enums';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableId = parseInt(params.timetableId);

	const teachers = await getUsersBySchoolIdAndType(user.schoolId, userTypeEnum.teacher);
	const activities = await getTimetableActivitiesByTimetableId(timetableId);

	const groups = await getTimetableStudentGroupsByTimetableId(timetableId);
	const defaultYearLevel = groups.length > 0 ? groups[0].yearLevel : yearLevelEnum.year7;

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

	const activitiesBySubjectId = activities.reduce(
		(acc, activity) => {
			if (!acc[activity.subject.id]) {
				acc[activity.subject.id] = [];
			}
			acc[activity.subject.id].push(activity);
			return acc;
		},
		{} as Record<number, typeof activities>
	);

	const defaultYearLevelSubjects = subjectsByYearLevel[defaultYearLevel] || [];
	const initialActivities = defaultYearLevelSubjects.map((subject) => ({
		subjectId: subject.id,
		periodsPerInstance: 1,
		totalPeriods: 5,
		teacherIds: []
	}));

	return {
		defaultYearLevel,
		yearLevels,
		groups,
		teachers,
		activitiesBySubjectId,
		subjectsByYearLevel,
		form: await superValidate(
			{ yearLevel: defaultYearLevel, activities: initialActivities },
			zod4(activityFormSchema)
		)
	};
};

export const actions = {
	createActivities: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableId = parseInt(params.timetableId);
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(activityFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Get student groups for the selected year level
			const groups = await getTimetableStudentGroupsByTimetableId(timetableId);
			const yearLevelGroups = groups.filter((group) => group.yearLevel === form.data.yearLevel);

			if (yearLevelGroups.length === 0) {
				return message(
					form,
					'No student groups found for the selected year level. Please create student groups first.',
					{ status: 400 }
				);
			}

			let totalActivitiesCreated = 0;

			// Create activities for each subject
			const activities = form.data.activities as Array<{
				subjectId: number;
				periodsPerInstance: number;
				totalPeriods: number;
				teacherIds: string[];
			}>;

			for (const activityData of activities) {
				// Distribute teachers across groups in round-robin fashion
				for (let i = 0; i < yearLevelGroups.length; i++) {
					const group = yearLevelGroups[i];
					const teacherIndex = i % activityData.teacherIds.length;
					const teacherId = activityData.teacherIds[teacherIndex];

					await createTimetableActivity({
						timetableId,
						subjectId: activityData.subjectId,
						teacherId,
						groupId: group.id,
						periodsPerInstance: activityData.periodsPerInstance,
						totalPeriods: activityData.totalPeriods
					});

					totalActivitiesCreated++;
				}
			}

			return message(form, `Successfully created ${totalActivitiesCreated} activities!`);
		} catch (error) {
			console.error('Error creating activities:', error);
			return message(form, 'Failed to create activities. Please try again.', { status: 500 });
		}
	}
};
