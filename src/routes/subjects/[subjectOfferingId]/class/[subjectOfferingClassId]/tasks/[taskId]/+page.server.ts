import { gradeReleaseEnum, quizModeEnum, taskStatusEnum, userTypeEnum } from '$lib/enums';
import {
	getClassTaskBlockResponsesByAuthorId,
	getClassTaskBlockResponsesByClassTaskId,
	getClassTaskResponsesWithStudents,
	getQuizSession,
	getSubjectOfferingClassTaskByTaskId,
	getTaskBlocksByTaskId,
	getTaskById,
	hasQuizBeenStarted,
	startQuizSession,
	startQuizSessionForAllStudents,
	updateQuizSession,
	updateSubjectOfferingClassTaskQuizSettings,
	updateSubjectOfferingClassTaskStatus,
	upsertClassTaskResponse
} from '$lib/server/db/service';
import { fail, redirect } from '@sveltejs/kit';

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

	const blocks = await getTaskBlocksByTaskId(taskIdInt);

	// Check if quiz has been started globally for manual quiz mode
	const quizGloballyStarted = await hasQuizBeenStarted(classTask.id);

	if (user.type === userTypeEnum.student) {
		await upsertClassTaskResponse(classTask.id, user.id);

		const blockResponses = await getClassTaskBlockResponsesByAuthorId(classTask.id, user.id);
		const quizSession = await getQuizSession(classTask.id, user.id);

		return {
			task,
			classTask,
			blocks,
			blockResponses,
			quizSession,
			quizGloballyStarted,
			subjectOfferingId,
			subjectOfferingClassId,
			user
		};
	}

	const responses = await getClassTaskResponsesWithStudents(classTask.id);
	const groupedBlockResponses = await getClassTaskBlockResponsesByClassTaskId(classTask.id);

	return {
		task,
		classTask,
		blocks,
		responses,
		groupedBlockResponses,
		quizGloballyStarted,
		subjectOfferingId,
		subjectOfferingClassId,
		user
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

		const data = await request.formData();
		let newStatus;
		try {
			newStatus = data.get('status') as taskStatusEnum;
		} catch (error) {
			console.error('Error parsing status:', error);
			return fail(400, { message: 'Invalid task status' });
		}

		if (!newStatus || !Object.values(taskStatusEnum).includes(newStatus)) {
			return fail(400, { message: 'Invalid task status' });
		}

		try {
			await updateSubjectOfferingClassTaskStatus(taskIdInt, classIdInt, newStatus);
			return { success: true };
		} catch (error) {
			console.error('Error changing task status:', error);
			return fail(500, { message: 'Failed to change task status' });
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

		const data = await request.formData();

		try {
			const quizMode = data.get('quizMode') as quizModeEnum;
			const quizStartTimeStr = data.get('quizStartTime') as string;
			const quizDurationMinutesStr = data.get('quizDurationMinutes') as string;
			const gradeRelease = data.get('gradeRelease') as gradeReleaseEnum;
			const gradeReleaseTimeStr = data.get('gradeReleaseTime') as string;

			const quizSettings: {
				quizMode?: quizModeEnum;
				quizStartTime?: Date | null;
				quizDurationMinutes?: number | null;
				gradeRelease?: gradeReleaseEnum;
				gradeReleaseTime?: Date | null;
			} = {};

			if (quizMode && Object.values(quizModeEnum).includes(quizMode)) {
				quizSettings.quizMode = quizMode;
			}

			if (quizStartTimeStr) {
				quizSettings.quizStartTime = new Date(quizStartTimeStr);
			} else {
				quizSettings.quizStartTime = null;
			}

			if (quizDurationMinutesStr) {
				const minutes = parseInt(quizDurationMinutesStr, 10);
				quizSettings.quizDurationMinutes = isNaN(minutes) ? null : minutes;
			} else {
				quizSettings.quizDurationMinutes = null;
			}

			if (gradeRelease && Object.values(gradeReleaseEnum).includes(gradeRelease)) {
				quizSettings.gradeRelease = gradeRelease;
			}

			if (gradeReleaseTimeStr) {
				quizSettings.gradeReleaseTime = new Date(gradeReleaseTimeStr);
			} else {
				quizSettings.gradeReleaseTime = null;
			}

			await updateSubjectOfferingClassTaskQuizSettings(taskIdInt, classIdInt, quizSettings);

			return { success: true };
		} catch (error) {
			console.error('Error updating quiz settings:', error);
			return fail(500, { message: 'Failed to update quiz settings' });
		}
	},

	startQuiz: async ({ locals: { security }, params: { taskId, subjectOfferingClassId } }) => {
		const user = security.isAuthenticated().getUser();

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' });
		}

		try {
			const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
			if (!classTask) {
				return fail(404, { message: 'Class task not found' });
			}

			// For manual mode: only teachers can start
			if (classTask.quizMode === quizModeEnum.manual) {
				if (user.type !== userTypeEnum.teacher) {
					return fail(403, { message: 'Only teachers can start manual quizzes' });
				}
				const startTime = await startQuizSessionForAllStudents(classTask.id);
				return { success: true, startTime };
			}

			// For scheduled mode: students can start if the scheduled time has passed
			if (classTask.quizMode === quizModeEnum.scheduled) {
				if (user.type === userTypeEnum.student) {
					// Check if scheduled time has passed
					if (classTask.quizStartTime) {
						const scheduleStartTime = new Date(classTask.quizStartTime).getTime();
						const now = Date.now();

						if (now >= scheduleStartTime) {
							// Auto-start for this student only
							const startTime = await startQuizSession(classTask.id, user.id);
							return { success: true, startTime };
						} else {
							return fail(400, { message: 'Scheduled quiz has not started yet' });
						}
					}
				}
				// Teachers cannot manually start scheduled quizzes
				return fail(400, {
					message: 'Scheduled quizzes start automatically at their scheduled time'
				});
			}

			return fail(400, { message: 'Quiz cannot be started in this mode' });
		} catch (error) {
			console.error('Error starting quiz session:', error);
			return fail(500, { message: 'Failed to start quiz session' });
		}
	},

	submitQuiz: async ({ locals: { security }, params: { taskId, subjectOfferingClassId } }) => {
		const user = security.isAuthenticated().getUser();

		if (user.type !== userTypeEnum.student) {
			return fail(403, { message: 'Only students can submit quiz sessions' });
		}

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' });
		}

		try {
			const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
			if (!classTask) {
				return fail(404, { message: 'Class task not found' });
			}

			await updateQuizSession(classTask.id, user.id, {
				quizEndedAt: new Date(),
				isQuizSubmitted: true,
				autoSubmitted: false
			});

			return { success: true };
		} catch (error) {
			console.error('Error submitting quiz:', error);
			return fail(500, { message: 'Failed to submit quiz' });
		}
	},

	autoSubmitQuiz: async ({ locals: { security }, params: { taskId, subjectOfferingClassId } }) => {
		const user = security.isAuthenticated().getUser();

		if (user.type !== userTypeEnum.student) {
			return fail(403, { message: 'Only students can submit quiz sessions' });
		}

		const taskIdInt = parseInt(taskId, 10);
		const classIdInt = parseInt(subjectOfferingClassId, 10);

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' });
		}

		try {
			const classTask = await getSubjectOfferingClassTaskByTaskId(taskIdInt, classIdInt);
			if (!classTask) {
				return fail(404, { message: 'Class task not found' });
			}

			await updateQuizSession(classTask.id, user.id, {
				quizEndedAt: new Date(),
				isQuizSubmitted: true,
				autoSubmitted: true
			});

			return { success: true };
		} catch (error) {
			console.error('Error auto-submitting quiz:', error);
			return fail(500, { message: 'Failed to auto-submit quiz' });
		}
	}
};
