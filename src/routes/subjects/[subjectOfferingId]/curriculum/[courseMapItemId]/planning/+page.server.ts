import {
        getCourseMapItemById,
        getCourseMapItemLearningAreas,
        getCoursemapItemLessonPlans,
        getCoursemapItemAssessmentPlans
} from '$lib/server/db/service/coursemap';
import { redirect } from '@sveltejs/kit';

export const load = async ({
        locals: { security },
        params: { subjectOfferingId, courseMapItemId }
}) => {
        security.isAuthenticated();

        const cmId = parseInt(courseMapItemId);

        const courseMapItem = await getCourseMapItemById(cmId);
        if (!courseMapItem) throw redirect(302, `/subjects/${subjectOfferingId}/curriculum`);

        const [learningAreas, lessonPlans, assessmentPlans] = await Promise.all([
                getCourseMapItemLearningAreas(cmId),
                getCoursemapItemLessonPlans(cmId),
                getCoursemapItemAssessmentPlans(cmId)
        ]);

        return {
                subjectOfferingId: parseInt(subjectOfferingId),
                courseMapItem,
                learningAreas,
                lessonPlans,
                assessmentPlans
        };
};
