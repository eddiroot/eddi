import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and, inArray, asc } from 'drizzle-orm';

export async function getCourseMapItemsBySubjectOfferingId(subjectOfferingId: number) {
	const courseMapItems = await db
		.select({
			courseMapItem: table.courseMapItem
		})
		.from(table.courseMapItem)
		.where(eq(table.courseMapItem.subjectOfferingId, subjectOfferingId))
		.orderBy(asc(table.courseMapItem.semester), asc(table.courseMapItem.startWeek));

	return courseMapItems;
}

export async function getCourseMapItemById(courseMapItemId: number) {
	const courseMapItem = await db
		.select({
			courseMapItem: table.courseMapItem
		})
		.from(table.courseMapItem)
		.where(eq(table.courseMapItem.id, courseMapItemId))
		.limit(1);

	return courseMapItem?.length ? courseMapItem[0].courseMapItem : null;
}

// null if not a core subject
export async function getSubjectOfferingLearningAreas(subjectOfferingId: number) {
	try {
		const learningAreas = await db
			.select({
				learningArea: table.learningArea
			})
			.from(table.subjectOffering)
			.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
			.innerJoin(table.coreSubject, eq(table.subject.coreSubjectId, table.coreSubject.id))
			.innerJoin(
				table.curriculumSubject,
				eq(table.coreSubject.curriculumSubjectId, table.curriculumSubject.id)
			)
			.innerJoin(
				table.learningArea,
				eq(table.learningArea.curriculumSubjectId, table.curriculumSubject.id)
			)
			.where(eq(table.subjectOffering.id, subjectOfferingId));

		return learningAreas.map((row) => row.learningArea);
	} catch (error) {
		console.error('Error fetching learning areas:', error);
		return null;
	}
}

export async function getAreaOfStudyContentByLearningAreaId(
	learningAreaId: number,
	yearLevel: table.yearLevelEnum
) {
	const curriculumContent = await db
		.select({
			learningAreaContent: table.learningAreaContent
		})
		.from(table.learningAreaContent)
		.where(
			and(
				eq(table.learningAreaContent.learningAreaId, learningAreaId),
				eq(table.learningAreaContent.yearLevel, yearLevel)
			)
		);
	return curriculumContent;
}

export async function addAreasOfStudyToCourseMapItem(
	courseMapItemId: number,
	learningAreaIds: number[]
) {
	if (learningAreaIds.length === 0) {
		return [];
	}

	const newRelationships = await db
		.insert(table.courseMapItemAreaOfSudty)
		.values(
			learningAreaIds.map((learningAreaId) => ({
				courseMapItemId: courseMapItemId,
				learningAreaId: learningAreaId
			}))
		)
		.onConflictDoNothing()
		.returning();

	return newRelationships;
}

export async function removeAreasOfStudyFromCourseMapItem(
	courseMapItemId: number,
	learningAreaIds: number[]
) {
	if (learningAreaIds.length === 0) {
		return [];
	}

	const deletedRelationships = await db
		.delete(table.courseMapItemAreaOfSudty)
		.where(
			and(
				eq(table.courseMapItemAreaOfSudty.courseMapItemId, courseMapItemId),
				inArray(table.courseMapItemAreaOfSudty.learningAreaId, learningAreaIds)
			)
		)
		.returning();

	return deletedRelationships;
}

export async function removeAllAreasOfStudyFromCourseMapItem(courseMapItemId: number) {
	const deletedRelationships = await db
		.delete(table.courseMapItemAreaOfSudty)
		.where(eq(table.courseMapItemAreaOfSudty.courseMapItemId, courseMapItemId))
		.returning();

	return deletedRelationships;
}

export async function setCourseMapItemAreasOfStudy(
	courseMapItemId: number,
	learningAreaIds: number[]
) {
	return await db.transaction(async (tx) => {
		await tx
			.delete(table.courseMapItemAreaOfSudty)
			.where(eq(table.courseMapItemAreaOfSudty.courseMapItemId, courseMapItemId));

		if (learningAreaIds.length > 0) {
			const newRelationships = await tx
				.insert(table.courseMapItemAreaOfSudty)
				.values(
					learningAreaIds.map((learningAreaId) => ({
						courseMapItemId: courseMapItemId,
						learningAreaId: learningAreaId
					}))
				)
				.returning();

			return newRelationships;
		}

		return [];
	});
}

export async function getCourseMapItemAreasOfStudy(courseMapItemId: number) {
	const relationships = await db
		.select({
			learningArea: table.learningArea,
			relationship: table.courseMapItemAreaOfSudty
		})
		.from(table.courseMapItemAreaOfSudty)
		.innerJoin(
			table.learningArea,
			eq(table.learningArea.id, table.courseMapItemAreaOfSudty.learningAreaId)
		)
		.where(eq(table.courseMapItemAreaOfSudty.courseMapItemId, courseMapItemId))
		.orderBy(table.learningArea.name);

	return relationships.map((row) => row.learningArea);
}

export async function getCoursemapItemAssessmentPlans(courseMapItemId: number) {
	const assessmentPlans = await db
		.select({
			assessmentPlan: table.courseMapItemAssessmentPlan
		})
		.from(table.courseMapItemAssessmentPlan)
		.where(eq(table.courseMapItemAssessmentPlan.courseMapItemId, courseMapItemId))
		.orderBy(asc(table.courseMapItemAssessmentPlan.name));

	return assessmentPlans.map((row) => row.assessmentPlan);
}

export async function getCoursemapItemAssessmentPlan(courseMapItemAssessmentPlanId: number) {
	const assessmentPlan = await db
		.select({
			assessmentPlan: table.courseMapItemAssessmentPlan
		})
		.from(table.courseMapItemAssessmentPlan)
		.where(eq(table.courseMapItemAssessmentPlan.id, courseMapItemAssessmentPlanId))
		.limit(1);

	return assessmentPlan?.length ? assessmentPlan[0].assessmentPlan : null;
}

export async function upsertCoursemapItemAssessmentPlan(
	courseMapItemId: number,
	name: string,
	description?: string | null
) {
	const [assessmentPlan] = await db
		.insert(table.courseMapItemAssessmentPlan)
		.values({
			courseMapItemId,
			name,
			description
		})
		.onConflictDoUpdate({
			target: table.courseMapItemAssessmentPlan.courseMapItemId,
			set: {
				name,
				description
			}
		})
		.returning();

	return assessmentPlan;
}

export async function deleteCoursemapItemAssessmentPlan(assessmentPlanId: number) {
	const deleted = await db
		.delete(table.courseMapItemAssessmentPlan)
		.where(eq(table.courseMapItemAssessmentPlan.id, assessmentPlanId))
		.returning();

	return deleted.length > 0;
}

export async function getCoursemapItemLessonPlans(courseMapItemId: number) {
	const lessonPlans = await db
		.select({
			lessonPlan: table.courseMapItemLessonPlan
		})
		.from(table.courseMapItemLessonPlan)
		.where(eq(table.courseMapItemLessonPlan.courseMapItemId, courseMapItemId))
		.orderBy(asc(table.courseMapItemLessonPlan.name));

	return lessonPlans.map((row) => row.lessonPlan);
}

export async function getCoursemapItemLessonPlan(courseMapItemLessonPlanId: number) {
	const lessonPlan = await db
		.select({
			lessonPlan: table.courseMapItemLessonPlan
		})
		.from(table.courseMapItemLessonPlan)
		.where(eq(table.courseMapItemLessonPlan.id, courseMapItemLessonPlanId))
		.limit(1);

	return lessonPlan?.length ? lessonPlan[0].lessonPlan : null;
}

export async function upsertCoursemapItemLessonPlan(
	courseMapItemId: number,
	name: string,
	description?: string | null
) {
	const [lessonPlan] = await db
		.insert(table.courseMapItemLessonPlan)
		.values({
			courseMapItemId,
			name,
			description
		})
		.onConflictDoUpdate({
			target: table.courseMapItemLessonPlan.courseMapItemId,
			set: {
				name,
				description
			}
		})
		.returning();

	return lessonPlan;
}

export async function deleteCoursemapItemLessonPlan(lessonPlanId: number) {
	const deleted = await db
		.delete(table.courseMapItemLessonPlan)
		.where(eq(table.courseMapItemLessonPlan.id, lessonPlanId))
		.returning();

	return deleted.length > 0;
}

export async function getCoursemapItemResources(courseMapItemId: number) {
	const resources = await db
		.select({
			resource: table.courseMapItemResource
		})
		.from(table.courseMapItemResource)
		.where(eq(table.courseMapItemResource.courseMapItemId, courseMapItemId))
		.orderBy(asc(table.courseMapItemResource.resourceId));

	return resources.map((row) => row.resource);
}

export async function addResourcesToCourseMapItem(courseMapItemId: number, resourceIds: number[]) {
	if (resourceIds.length === 0) {
		return [];
	}

	const newRelationships = await db
		.insert(table.courseMapItemResource)
		.values(
			resourceIds.map((resourceId) => ({
				courseMapItemId: courseMapItemId,
				resourceId: resourceId
			}))
		)
		.onConflictDoNothing()
		.returning();

	return newRelationships;
}

export async function removeResourcesFromCourseMapItem(
	courseMapItemId: number,
	resourceIds: number[]
) {
	if (resourceIds.length === 0) {
		return [];
	}

	const deletedRelationships = await db
		.delete(table.courseMapItemResource)
		.where(
			and(
				eq(table.courseMapItemResource.courseMapItemId, courseMapItemId),
				inArray(table.courseMapItemResource.resourceId, resourceIds)
			)
		)
		.returning();

	return deletedRelationships;
}

export async function removeAllResourcesFromCourseMapItem(courseMapItemId: number) {
	const deletedRelationships = await db
		.delete(table.courseMapItemResource)
		.where(eq(table.courseMapItemResource.courseMapItemId, courseMapItemId))
		.returning();

	return deletedRelationships;
}

export async function getSubjectOfferingTasksByCourseMapItem(courseMapItemId: number) {
	try {
		const tasks = await db
			.select({
				task: table.task
			})
			.from(table.task)
			.innerJoin(table.subjectOfferingTask, eq(table.task.id, table.subjectOfferingTask.taskId))
			.where(eq(table.subjectOfferingTask.courseMapItemId, courseMapItemId))
			.orderBy(asc(table.subjectOfferingTask.createdAt));
		return tasks.map((row) => row.task);
	} catch (error) {
		console.error('Error fetching tasks for course map item:', error);
		return [];
	}
}

export async function getTeacherReleasedTasksByCourseMapItem(
	userId: string,
	courseMapItemId: number
) {
	try {
		const tasks = await db
			.select({
				task: table.task
			})
			.from(table.task)
			.innerJoin(table.subjectOfferingTask, eq(table.task.id, table.subjectOfferingTask.taskId))
			.innerJoin(
				table.subjectOfferingClassTask,
				eq(table.subjectOfferingTask.id, table.subjectOfferingClassTask.subjectOfferingTaskId)
			)
			.innerJoin(
				table.userSubjectOfferingClass,
				eq(
					table.subjectOfferingClassTask.subjectOfferingClassId,
					table.userSubjectOfferingClass.subOffClassId
				)
			)
			.where(
				and(
					eq(table.subjectOfferingTask.courseMapItemId, courseMapItemId),
					eq(table.userSubjectOfferingClass.userId, userId)
				)
			);
		return tasks.map((row) => row.task);
	} catch (error) {
		console.error('Error fetching teacher released tasks for course map item:', error);
		return [];
	}
}
