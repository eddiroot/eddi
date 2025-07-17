import {
        getCourseMapItemById,
        getCourseMapItemLearningAreas,
        getCoursemapItemLessonPlans,
        getCoursemapItemAssessmentPlans,
        createCourseMapItemLessonPlan,
        createLessonPlanStandard,
        getCourseMapItemPlanContexts
} from '$lib/server/db/service/coursemap';
import { redirect, fail } from '@sveltejs/kit';
import { geminiCompletion } from '$lib/server/ai';
import { planSchema, buildLessonPlanPrompt } from '$lib/server/planSchema';

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

export const actions = {
        createLessonPlan: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const instruction = (formData.get('instruction') as string) || '';

                try {
                        const contexts = await getCourseMapItemPlanContexts(courseMapItemId);
                        const prompt = buildLessonPlanPrompt(JSON.stringify(contexts), instruction);
                        const aiResponse = await geminiCompletion(prompt, undefined, planSchema);
                        
                        let plan;
                        try {
                                plan = JSON.parse(aiResponse);
                        } catch (err) {
                                console.error('Failed to parse AI response', err, aiResponse);
                                return fail(500, { message: 'Failed to generate lesson plan' });
                        }

                        const lessonPlan = await createCourseMapItemLessonPlan(
                                courseMapItemId,
                                plan.name,
                                plan.scopes.map((s: { title: string; details: string }) => `${s.title}: ${s.details}`),
                                plan.description
                        );

                        if (Array.isArray(plan.usedStandards)) {
                                for (const std of plan.usedStandards) {
                                        if (std?.id) await createLessonPlanStandard(lessonPlan.id, std.id);
                                }
                        }

                        return { success: true, lessonPlan };
                } catch (error) {
                        console.error('Error creating lesson plan:', error);
                        return fail(500, { message: 'Failed to create lesson plan' });
                }
        }
};
