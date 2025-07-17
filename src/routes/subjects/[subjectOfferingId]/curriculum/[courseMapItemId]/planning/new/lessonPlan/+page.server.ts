import { redirect, fail } from '@sveltejs/kit';
import {
        createCourseMapItemLessonPlan,
        createLessonPlanStandard,
        getCourseMapItemPlanContexts
} from '$lib/server/db/service/coursemap';
import { geminiCompletion } from '$lib/server/ai';
import { planSchema, buildLessonPlanPrompt } from '$lib/server/planSchema';

export const load = async ({ locals: { security } }) => {
        security.isAuthenticated();
        return {};
};

export const actions = {
        create: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const instruction = (formData.get('instruction') as string) || '';

                const contexts = await getCourseMapItemPlanContexts(courseMapItemId);
                const prompt = buildLessonPlanPrompt(JSON.stringify(contexts), instruction);
                console.log('Generated Prompt:', prompt);
                const aiResponse = await geminiCompletion(prompt, undefined, planSchema);
                console.log('AI Response:', aiResponse);
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

                throw redirect(
                        303,
                        `/subjects/${params.subjectOfferingId}/curriculum/${params.courseMapItemId}/planning/${lessonPlan.id}`
                );
        }
};
