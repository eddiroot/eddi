import { gradeReleaseEnum, quizModeEnum, userTypeEnum } from '$lib/enums';
import {
	getClassTaskBlockResponsesByAuthorId,
	getClassTaskBlockResponsesByClassTaskId,
	getClassTaskResponsesWithStudents,
	getSubjectOfferingClassTaskByTaskId,
	getTaskBlocksByTaskId,
	getTaskById,
	startQuizSession,
	startQuizSessionForAllStudents,
	updateSubjectOfferingClassTaskQuizSettings,
	updateSubjectOfferingClassTaskStatus,
	upsertClassTaskResponse
} from '$lib/server/db/service';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { quizSettingsFormSchema, startQuizFormSchema, statusFormSchema } from './schema';

export const load = async ({
	locals: { security },
	params: { taskId, subjectOfferingId, subjectOfferingClassId }
}) => {
	const user = security.isAuthenticated().getUser();

	let taskIdInt;
	try {
		taskIdInt = parseInt(taskId, 10);
	} catch {
		throw redirect(302, '/dashboard');
	}

	const classIdInt = parseInt(subjectOfferingClassId, 10);
	if (isNaN(classIdInt)) {
		throw redirect(302, '/dashboard');
	}

	const task = await getTaskById(taskIdInt);
	if (!task) throw redirect(302, '/dashboard');

	const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
	if (!classTask) throw redirect(302, '/dashboard');

	const isQuizStarted = classTask.quizStartTime && classTask.quizStartTime < new Date();

	const blocks = await getTaskBlocksByTaskId(taskIdInt);

	// Initialize superforms
	const [statusForm, quizSettingsForm, startQuizForm] = await Promise.all([
		superValidate({ status: classTask.status }, zod4(statusFormSchema)),
		superValidate(
			{
				quizMode: classTask.quizMode || quizModeEnum.none,
				quizStartTime: classTask.quizStartTime
					? classTask.quizStartTime.toISOString().slice(0, 16)
					: undefined,
				quizDurationMinutes: classTask.quizDurationMinutes || undefined,
				gradeRelease: classTask.gradeRelease || undefined,
				gradeReleaseTime: classTask.gradeReleaseTime
					? classTask.gradeReleaseTime.toISOString().slice(0, 16)
					: undefined
			},
			zod4(quizSettingsFormSchema)
		),
		superValidate(zod4(startQuizFormSchema))
	]);

	if (user.type === userTypeEnum.student) {
		await upsertClassTaskResponse(classTask.id, user.id);

		const blockResponses = await getClassTaskBlockResponsesByAuthorId(classTask.id, user.id);

		return {
			task,
			isQuizStarted,
			classTask,
			blocks,
			blockResponses,
			subjectOfferingId,
			subjectOfferingClassId,
			user,
			statusForm,
			quizSettingsForm,
			startQuizForm
		};
	}

	const responses = await getClassTaskResponsesWithStudents(classTask.id);
	const groupedBlockResponses = await getClassTaskBlockResponsesByClassTaskId(classTask.id);

	return {
		task,
		isQuizStarted,
		classTask,
		blocks,
		responses,
		groupedBlockResponses,
		subjectOfferingId,
		subjectOfferingClassId,
		user,
		statusForm,
		quizSettingsForm,
		startQuizForm
	};
};

export const actions = {
	status: async ({ request, locals: { security }, params: { taskId, subjectOfferingClassId } }) => {
		const user = security.isAuthenticated().getUser();

		if (user.type === userTypeEnum.student) {
			return fail(403, { message: 'Students are not allowed to change task status' });
		}

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' });
		}

		const form = await superValidate(request, zod4(statusFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateSubjectOfferingClassTaskStatus(taskIdInt, classIdInt, form.data.status);
			return { form };
		} catch (error) {
			console.error('Error changing task status:', error);
			return fail(500, { form, message: 'Failed to change task status' });
		}
	},

	updateQuizSettings: async ({
		request,
		locals: { security },
		params: { taskId, subjectOfferingClassId }
	}) => {
		const user = security.isAuthenticated().getUser();

		if (user.type === userTypeEnum.student) {
			return fail(403, { message: 'Students are not allowed to update quiz settings' });
		}

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' });
		}

		const form = await superValidate(request, zod4(quizSettingsFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const quizSettings: {
				quizMode?: quizModeEnum;
				quizStartTime?: Date | null;
				quizDurationMinutes?: number | null;
				gradeRelease?: gradeReleaseEnum;
				gradeReleaseTime?: Date | null;
			} = {
				quizMode: form.data.quizMode,
				quizStartTime: form.data.quizStartTime ? new Date(form.data.quizStartTime) : null,
				quizDurationMinutes: form.data.quizDurationMinutes || null,
				gradeRelease: form.data.gradeRelease || undefined,
				gradeReleaseTime: form.data.gradeReleaseTime ? new Date(form.data.gradeReleaseTime) : null
			};

			await updateSubjectOfferingClassTaskQuizSettings(taskIdInt, classIdInt, quizSettings);

			return { form };
		} catch (error) {
			console.error('Error updating quiz settings:', error);
			return fail(500, { form, message: 'Failed to update quiz settings' });
		}
	},

	startQuiz: async ({
		request,
		locals: { security },
		params: { taskId, subjectOfferingClassId }
	}) => {
		const user = security.isAuthenticated().getUser();

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' });
		}

		const form = await superValidate(request, zod4(startQuizFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
			if (!classTask) {
				return fail(404, { form, message: 'Class task not found' });
			}

			if (classTask.quizMode === quizModeEnum.manual) {
				if (user.type !== userTypeEnum.teacher) {
					return fail(403, { form, message: 'Only teachers can start manual quizzes' });
				}
				const startTime = await startQuizSessionForAllStudents(classTask.id);
				return { form, success: true, startTime };
			}

			if (classTask.quizMode === quizModeEnum.scheduled) {
				if (user.type === userTypeEnum.student) {
					if (classTask.quizStartTime) {
						const scheduleStartTime = new Date(classTask.quizStartTime).getTime();
						const now = Date.now();

						if (now >= scheduleStartTime) {
							const startTime = await startQuizSession(classTask.id, user.id);
							return { form, success: true, startTime };
						} else {
							return fail(400, { form, message: 'Scheduled quiz has not started yet' });
						}
					}
				}

				return fail(400, {
					form,
					message: 'Scheduled quizzes start automatically at their scheduled time'
				});
			}

			return fail(400, { form, message: 'Quiz cannot be started in this mode' });
		} catch (error) {
			console.error('Error starting quiz session:', error);
			return fail(500, { form, message: 'Failed to start quiz session' });
		}
	}
};
