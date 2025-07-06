import type { Lesson, LessonTopic } from '$lib/server/db/schema.js';
import { getUserLessonsBySubjectOfferingId } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	const user = security.isAuthenticated().getUser();

	let subjectOfferingIdInt;
	try {
		subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	} catch {
		return { subject: null };
	}

	const lessons = await getUserLessonsBySubjectOfferingId(user.id, subjectOfferingIdInt);

	const topicsWithLessons = lessons.reduce(
		(acc, lesson) => {
			const topicId = lesson.lessonTopic.id;
			let topicEntry = acc.find((item) => item.topic.id === topicId);
			if (!topicEntry) {
				topicEntry = { topic: lesson.lessonTopic, lessons: [] };
				acc.push(topicEntry);
			}
			topicEntry.lessons.push(lesson.lesson);
			return acc;
		},
		[] as Array<{ topic: LessonTopic; lessons: Array<Lesson> }>
	);

	return { user, topicsWithLessons };
};
