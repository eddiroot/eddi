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
import { geminiCompletion, geminiImageGeneration } from '$lib/server/ai';
import { planSchema, buildLessonPlanPrompt, buildLessonPlanImagePrompt } from '$lib/server/planSchema';

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
        generateLessonPlanResponse: async ({ request, params, locals: { security } }) => {
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
                                return fail(500, { message: 'Failed to generate lesson plan summary' });
                        }

                        // Generate image for the lesson plan
                        let imageBase64 = null;
                        try {
                                const imagePrompt = buildLessonPlanImagePrompt(plan);
                                imageBase64 = await geminiImageGeneration(imagePrompt);
                        } catch (err) {
                                console.error('Failed to generate image', err);
                                // Continue without image if generation fails
                        }

                        return { 
                                success: true, 
                                planData: plan,
                                imageBase64,
                                instruction // Store the instruction for regeneration
                        };
                } catch (error) {
                        console.error('Error generating lesson plan:', error);
                        return fail(500, { message: 'Failed to generate lesson plan' });
                }
        },

        createLessonPlan: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const planDataJson = formData.get('planData') as string;
                const imageBase64 = formData.get('imageBase64') as string;

                try {
                        const plan = JSON.parse(planDataJson);

                        const lessonPlan = await createCourseMapItemLessonPlan(
                                courseMapItemId,
                                plan.name,
                                plan.scopes.map((s: { title: string; details: string }) => `${s.title}: ${s.details}`),
                                plan.description,
                                imageBase64 || null
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
