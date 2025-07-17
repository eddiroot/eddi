import {
        getCourseMapItemById,
        getCoursemapItemLessonPlan,
        getLessonPlanLearningAreaStandards
} from '$lib/server/db/service/coursemap';
import { redirect } from '@sveltejs/kit';

export const load = async ({
        locals: { security },
        params: { subjectOfferingId, courseMapItemId, courseMapItemLessonPlanId }
}) => {
        security.isAuthenticated();

        const cmId = parseInt(courseMapItemId);
        const planId = parseInt(courseMapItemLessonPlanId);

        const [courseMapItem, lessonPlan] = await Promise.all([
                getCourseMapItemById(cmId),
                getCoursemapItemLessonPlan(planId)
        ]);

        if (!courseMapItem || !lessonPlan) {
                throw redirect(302, `/subjects/${subjectOfferingId}/curriculum/${courseMapItemId}/planning`);
        }

        const standards = await getLessonPlanLearningAreaStandards(planId);

        return {
                subjectOfferingId: parseInt(subjectOfferingId),
                courseMapItem,
                lessonPlan,
                standards
        };
};
