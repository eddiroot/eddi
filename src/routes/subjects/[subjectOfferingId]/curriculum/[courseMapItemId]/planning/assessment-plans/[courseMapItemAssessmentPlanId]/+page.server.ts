import {
	getCourseMapItemById,
	getCoursemapItemAssessmentPlan,
	getAssessmentPlanLearningAreaStandards
} from '$lib/server/db/service/coursemap';
import { getRubricWithRowsAndCells } from '$lib/server/db/service/task';
import { redirect } from '@sveltejs/kit';

export const load = async ({
	locals: { security },
	params: { subjectOfferingId, courseMapItemId, courseMapItemAssessmentPlanId }
}) => {
	security.isAuthenticated();

	const cmId = parseInt(courseMapItemId);
	const planId = parseInt(courseMapItemAssessmentPlanId);

	const [courseMapItem, assessmentPlan] = await Promise.all([
		getCourseMapItemById(cmId),
		getCoursemapItemAssessmentPlan(planId)
	]);

	if (!courseMapItem || !assessmentPlan) {
		throw redirect(302, `/subjects/${subjectOfferingId}/curriculum/${courseMapItemId}/planning`);
	}

	const [standards, rubric] = await Promise.all([
		getAssessmentPlanLearningAreaStandards(planId),
		assessmentPlan.rubricId ? getRubricWithRowsAndCells(assessmentPlan.rubricId) : null
	]);

	return {
		subjectOfferingId: parseInt(subjectOfferingId),
		courseMapItem,
		assessmentPlan,
		standards,
		rubric
	};
};
