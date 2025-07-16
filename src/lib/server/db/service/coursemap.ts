import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and, inArray, asc, max } from 'drizzle-orm';

export async function getLatestVersionForCourseMapItemBySubjectOfferingId(
	subjectOfferingId: number
) {
	const [version] = await db
		.select({ max: max(table.courseMapItem.version) })
		.from(table.courseMapItem)
		.where(
			and(
				eq(table.courseMapItem.subjectOfferingId, subjectOfferingId),
				eq(table.courseMapItem.isArchived, false)
			)
		)
		.limit(1);

	return version?.max ?? null;
}

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

export async function getCourseMapItemAndLearningAreaByVersionAndBySubjectOfferingId(
	subjectOfferingId: number,
	version: number
) {
	const items = await db
		.select({
			courseMapItem: table.courseMapItem,
			learningArea: table.learningArea
		})
		.from(table.courseMapItem)
		.leftJoin(
			table.courseMapItemLearningArea,
			eq(table.courseMapItemLearningArea.courseMapItemId, table.courseMapItem.id)
		)
		.leftJoin(
			table.learningArea,
			eq(table.learningArea.id, table.courseMapItemLearningArea.learningAreaId)
		)
		.where(
			and(
				eq(table.courseMapItem.subjectOfferingId, subjectOfferingId),
				eq(table.courseMapItem.version, version),
				eq(table.courseMapItem.isArchived, false)
			)
		)
		.orderBy(asc(table.courseMapItem.startWeek), asc(table.courseMapItem.semester));

	return items;
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

export async function getLearningAreaStandardByLearningAreaId(
	learningAreaId: number,
	yearLevel: table.yearLevelEnum
) {
	const curriculumStandard = await db
		.select({
			learningAreaStandard: table.learningAreaStandard
		})
		.from(table.learningAreaStandard)
		.where(
			and(
				eq(table.learningAreaStandard.learningAreaId, learningAreaId),
				eq(table.learningAreaStandard.yearLevel, yearLevel)
			)
		);
	return curriculumStandard;
}

export async function addAreasOfStudyToCourseMapItem(
	courseMapItemId: number,
	learningAreaIds: number[]
) {
	if (learningAreaIds.length === 0) {
		return [];
	}

	const newRelationships = await db
		.insert(table.courseMapItemLearningArea)
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
		.delete(table.courseMapItemLearningArea)
		.where(
			and(
				eq(table.courseMapItemLearningArea.courseMapItemId, courseMapItemId),
				inArray(table.courseMapItemLearningArea.learningAreaId, learningAreaIds)
			)
		)
		.returning();

	return deletedRelationships;
}

export async function removeAllAreasOfStudyFromCourseMapItem(courseMapItemId: number) {
	const deletedRelationships = await db
		.delete(table.courseMapItemLearningArea)
		.where(eq(table.courseMapItemLearningArea.courseMapItemId, courseMapItemId))
		.returning();

	return deletedRelationships;
}

export async function setCourseMapItemAreasOfStudy(
	courseMapItemId: number,
	learningAreaIds: number[]
) {
	return await db.transaction(async (tx) => {
		await tx
			.delete(table.courseMapItemLearningArea)
			.where(eq(table.courseMapItemLearningArea.courseMapItemId, courseMapItemId));

		if (learningAreaIds.length > 0) {
			const newRelationships = await tx
				.insert(table.courseMapItemLearningArea)
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

export async function getCourseMapItemLearningAreas(courseMapItemId: number) {
	const relationships = await db
		.select({
			learningArea: table.learningArea,
			relationship: table.courseMapItemLearningArea
		})
		.from(table.courseMapItemLearningArea)
		.innerJoin(
			table.learningArea,
			eq(table.learningArea.id, table.courseMapItemLearningArea.learningAreaId)
		)
		.where(eq(table.courseMapItemLearningArea.courseMapItemId, courseMapItemId))
		.orderBy(table.learningArea.name);

	return relationships.map((row) => row.learningArea);
}

export async function getCoursemapItemAssessmentPlans(courseMapItemId: number) {
	const assessmentPlans = await db
		.select({
			assessmentPlan: table.courseMapItemAssessmentPlan,
			laStandard: table.assessmentPlanLearningAreaStandard
		})
		.from(table.courseMapItemAssessmentPlan)
		.leftJoin(
			table.assessmentPlanLearningAreaStandard,
			eq(
				table.assessmentPlanLearningAreaStandard.courseMapItemAssessmentPlanId,
				table.courseMapItemAssessmentPlan.id
			)
		)
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

export async function createCourseMapItemLessonPlan(
	courseMapItemId: number,
	name: string,
	scope?: string[] | null,
	description?: string | null
) {
	const [lessonPlan] = await db
		.insert(table.courseMapItemLessonPlan)
		.values({
			courseMapItemId,
			name,
			scope,
			description
		})
		.returning();

	return lessonPlan;
}

export async function updateCourseMapItemLessonPlan(
	lessonPlanId: number,
	name?: string,
	scope?: string[] | null,
	description?: string | null
) {
	const [lessonPlan] = await db
		.update(table.courseMapItemLessonPlan)
		.set({
			name,
			scope,
			description
		})
		.where(eq(table.courseMapItemLessonPlan.id, lessonPlanId))
		.returning();

	return lessonPlan;
}

export interface PlanContext {
	description: string | null;
	standards:{
		learningAreaStandard: table.LearningAreaStandard;
		standardElaborations: table.StandardElaboration[];
		}[]
}

export async function getCourseMapItemPlanContexts(
  courseMapItemId: number
): Promise<PlanContext[]> {
  const rows = await db
    .select({
      description: table.courseMapItem.description,
      learningAreaStandard: table.learningAreaStandard,
      standardElaboration: table.standardElaboration
    })
    .from(table.courseMapItem)
    .leftJoin(
      table.courseMapItemLearningArea,
      eq(table.courseMapItemLearningArea.courseMapItemId, table.courseMapItem.id)
    )
    .leftJoin(
      table.learningAreaStandard,
      eq(
        table.learningAreaStandard.learningAreaId,
        table.courseMapItemLearningArea.learningAreaId
      )
    )
    .leftJoin(
      table.standardElaboration,
      eq(
        table.standardElaboration.learningAreaStandardId,
        table.learningAreaStandard.id
      )
    )
    .where(eq(table.courseMapItem.id, courseMapItemId));

  if (rows.length === 0) return [];

  const description = rows[0].description;

  // Use the actual row types here
  const standardsMap = new Map<
    number,
    { learningAreaStandard: table.LearningAreaStandard; standardElaborations: table.StandardElaboration[] }
  >();

  for (const { learningAreaStandard, standardElaboration } of rows) {
    if (!learningAreaStandard) continue; 
    const id = learningAreaStandard.id;

    if (!standardsMap.has(id)) {
      standardsMap.set(id, {
        learningAreaStandard,
        standardElaborations: []
      });
    }
    if (standardElaboration) {
      standardsMap.get(id)!.standardElaborations.push(standardElaboration);
    }
  }

  return [
    {
      description,
      standards: Array.from(standardsMap.values())
    }
  ];
}

export async function createLessonPlanStandard(lessonPlanId: number, standardId: number) {
	const [standard] = await db
		.insert(table.lessonPlanLearningAreaStandard)
		.values({
			courseMapItemLessonPlanId: lessonPlanId,
			learningAreaStandardId: standardId
		})
		.returning();

	return standard;
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

export async function getTasksByCourseMapItemId(courseMapItemId: number) {
	try {
		const tasks = await db
			.select({
				task: table.task
			})
			.from(table.task)
			.innerJoin(
				table.subjectOfferingClassTask,
				eq(table.task.id, table.subjectOfferingClassTask.taskId)
			)
			.where(eq(table.subjectOfferingClassTask.courseMapItemId, courseMapItemId))
			.orderBy(asc(table.subjectOfferingClassTask.createdAt));
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
			.innerJoin(
				table.subjectOfferingClassTask,
				eq(table.task.id, table.subjectOfferingClassTask.taskId)
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
					eq(table.subjectOfferingClassTask.courseMapItemId, courseMapItemId),
					eq(table.userSubjectOfferingClass.userId, userId)
				)
			);
		return tasks.map((row) => row.task);
	} catch (error) {
		console.error('Error fetching teacher released tasks for course map item:', error);
		return [];
	}
}

export async function createCourseMapItem(
	subjectOfferingId: number,
	topic: string,
	semester?: number,
	startWeek?: number,
	description?: string | null
) {
	const [courseMapItem] = await db
		.insert(table.courseMapItem)
		.values({
			subjectOfferingId,
			topic,
			semester,
			startWeek,
			description
		})
		.returning();

	return courseMapItem;
}


