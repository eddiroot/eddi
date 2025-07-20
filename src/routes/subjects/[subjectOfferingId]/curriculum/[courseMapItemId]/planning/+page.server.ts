import {
        getCourseMapItemById,
        getCourseMapItemLearningAreas,
        getCoursemapItemLessonPlans,
        getCoursemapItemAssessmentPlans,
        createCourseMapItemLessonPlan,
        createLessonPlanStandard,
        createCourseMapItemAssessmentPlan,
        createAssessmentPlanStandard,
        getCourseMapItemPlanContexts,
        getSubjectOfferingLearningAreas,
        addAreasOfStudyToCourseMapItem,
        setCourseMapItemAreasOfStudy,
        removeAreasOfStudyFromCourseMapItem,
        updateCourseMapItem,
        getCoursemapItemResources,
        removeResourceFromCourseMapItem,
        createResource,
        addResourceToCourseMapItem
} from '$lib/server/db/service';
import { createCompleteRubric } from '$lib/server/db/service/task';
import { redirect, fail } from '@sveltejs/kit';
import { geminiCompletion, geminiImageGeneration } from '$lib/server/ai';
import { 
        planSchema, 
        buildLessonPlanPrompt, 
        buildLessonPlanImagePrompt,
        assessmentSchema,
        buildAssessmentPlanPrompt,
        buildAssessmentPlanImagePrompt
} from '$lib/server/planSchema';
import { uploadBufferHelper, generateUniqueFileName } from '$lib/server/obj';

export const load = async ({
        locals: { security },
        params: { subjectOfferingId, courseMapItemId }
}) => {
        security.isAuthenticated();

        const cmId = parseInt(courseMapItemId);

        const courseMapItem = await getCourseMapItemById(cmId);
        if (!courseMapItem) throw redirect(302, `/subjects/${subjectOfferingId}/curriculum`);

        const [learningAreas, lessonPlans, assessmentPlans, availableLearningAreas, resources] = await Promise.all([
                getCourseMapItemLearningAreas(cmId),
                getCoursemapItemLessonPlans(cmId),
                getCoursemapItemAssessmentPlans(cmId),
                getSubjectOfferingLearningAreas(parseInt(subjectOfferingId)),
                getCoursemapItemResources(cmId)
        ]);

        return {
                subjectOfferingId: parseInt(subjectOfferingId),
                courseMapItem,
                learningAreas,
                lessonPlans,
                assessmentPlans,
                availableLearningAreas: availableLearningAreas || [],
                resources
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
        },

        addLearningArea: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const learningAreaId = parseInt(formData.get('learningAreaId') as string);

                try {
                        await addAreasOfStudyToCourseMapItem(courseMapItemId, [learningAreaId]);
                        return { success: true };
                } catch (error) {
                        console.error('Error adding learning area:', error);
                        return fail(500, { message: 'Failed to add learning area' });
                }
        },

        updateCourseMapItem: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const topic = formData.get('topic') as string;
                const description = formData.get('description') as string;
                const startWeek = parseInt(formData.get('startWeek') as string);
                const duration = parseInt(formData.get('duration') as string);
                const learningAreaIdsJson = formData.get('learningAreaIds') as string;

                if (!topic) {
                        return fail(400, { message: 'Topic is required' });
                }

                try {
                        // Update course map item using service function
                        const updatedItem = await updateCourseMapItem(
                                courseMapItemId,
                                topic,
                                description,
                                startWeek,
                                duration
                        );

                        // Update learning areas
                        if (learningAreaIdsJson) {
                                const learningAreaIds = JSON.parse(learningAreaIdsJson);
                                await setCourseMapItemAreasOfStudy(courseMapItemId, learningAreaIds);
                        }

                        return { success: true, courseMapItem: updatedItem };
                } catch (error) {
                        console.error('Error updating course map item:', error);
                        return fail(500, { message: 'Failed to update course map item' });
                }
        },

        removeLearningArea: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const learningAreaId = parseInt(formData.get('learningAreaId') as string);

                try {
                        await removeAreasOfStudyFromCourseMapItem(courseMapItemId, [learningAreaId]);
                        return { success: true };
                } catch (error) {
                        console.error('Error removing learning area:', error);
                        return fail(500, { message: 'Failed to remove learning area' });
                }
        },

        generateAssessmentPlanResponse: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const instruction = (formData.get('instruction') as string) || '';

                try {
                        const contexts = await getCourseMapItemPlanContexts(courseMapItemId);
                        const prompt = buildAssessmentPlanPrompt(JSON.stringify(contexts), instruction);
                        const aiResponse = await geminiCompletion(prompt, undefined, assessmentSchema);
                        
                        let plan;
                        try {
                                plan = JSON.parse(aiResponse);
                                console.log('Generated assessment plan:', plan);
                        } catch (err) {
                                console.error('Failed to parse AI response', err, aiResponse);
                                return fail(500, { message: 'Failed to generate assessment plan summary' });
                        }

                        // Generate image for the assessment plan
                        let imageBase64 = null;
                        try {
                                const imagePrompt = buildAssessmentPlanImagePrompt(plan);
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
                        console.error('Error generating assessment plan:', error);
                        return fail(500, { message: 'Failed to generate assessment plan' });
                }
        },

        createAssessmentPlan: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const planDataJson = formData.get('planData') as string;
                const imageBase64 = formData.get('imageBase64') as string;

                console.log('Creating assessment plan for courseMapItemId:', courseMapItemId);

                try {
                        const plan = JSON.parse(planDataJson);
                        console.log('Parsed assessment plan data:', { name: plan.name, rubricRowsCount: plan.rubric?.rows?.length });

                        // First create the rubric
                        const rubricData = {
                                title: `${plan.name} - Rubric`,
                                rows: plan.rubric.rows.map((row: { title: string; cells: Array<{ level: string; description: string; marks: number }> }) => ({
                                        title: row.title,
                                        cells: row.cells.map((cell: { level: string; description: string; marks: number }) => ({
                                                level: cell.level as 'exemplary' | 'accomplished' | 'developing' | 'beginning',
                                                description: cell.description,
                                                marks: cell.marks
                                        }))
                                }))
                        };

                        console.log('Creating rubric with data:', { title: rubricData.title, rowsCount: rubricData.rows.length });

                        const { rubric } = await createCompleteRubric(
                                rubricData.title,
                                rubricData.rows
                        );

                        console.log('Created rubric with ID:', rubric.id);

                        // Create the assessment plan with the rubric
                        const assessmentPlan = await createCourseMapItemAssessmentPlan(
                                courseMapItemId,
                                plan.name,
                                plan.scopes.map((s: { title: string; details: string }) => `${s.title}: ${s.details}`),
                                plan.description,
                                imageBase64 || null,
                                rubric.id
                        );

                        console.log('Created assessment plan with ID:', assessmentPlan.id);

                        // Add used standards
                        if (Array.isArray(plan.usedStandards)) {
                                for (const std of plan.usedStandards) {
                                        if (std?.id) await createAssessmentPlanStandard(assessmentPlan.id, std.id);
                                }
                        }

                        console.log('Successfully completed assessment plan creation');
                        return { success: true, assessmentPlan };
                } catch (error) {
                        console.error('Error creating assessment plan:', error);
                        return fail(500, { message: 'Failed to create assessment plan' });
                }
        },

        removeResource: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const resourceId = parseInt(formData.get('resourceId') as string);

                try {
                        await removeResourceFromCourseMapItem(courseMapItemId, resourceId);
                        return { success: true };
                } catch (error) {
                        console.error('Error removing resource:', error);
                        return fail(500, { message: 'Failed to remove resource' });
                }
        },

        uploadResource: async ({ request, params, locals: { security } }) => {
                security.isAuthenticated();

                const courseMapItemId = parseInt(params.courseMapItemId);
                const formData = await request.formData();
                const file = formData.get('file') as File;
                
                // Auto-infer name and type (passed from client but we could also do it here)
                let name = formData.get('name') as string;
                let resourceType = formData.get('resourceType') as string;

                // Fallback inference if not provided
                if (!name) {
                        name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
                }
                
                if (!resourceType) {
                        const extension = file.name.split('.').pop()?.toLowerCase();
                        switch (extension) {
                                case 'jpg':
                                case 'jpeg':
                                case 'png':
                                case 'gif':
                                case 'bmp':
                                case 'webp':
                                case 'svg':
                                        resourceType = 'image';
                                        break;
                                case 'mp4':
                                case 'mov':
                                case 'avi':
                                case 'mkv':
                                case 'webm':
                                case 'wmv':
                                        resourceType = 'video';
                                        break;
                                case 'mp3':
                                case 'wav':
                                case 'ogg':
                                case 'flac':
                                case 'm4a':
                                        resourceType = 'audio';
                                        break;
                                case 'pdf':
                                        resourceType = 'pdf';
                                        break;
                                case 'doc':
                                case 'docx':
                                case 'txt':
                                case 'rtf':
                                        resourceType = 'document';
                                        break;
                                default:
                                        resourceType = 'file';
                        }
                }

                if (!file) {
                        return fail(400, { message: 'No file provided' });
                }

                try {
                        // Generate unique file name
                        const uniqueFileName = generateUniqueFileName(file.name);
                        
                        // Convert file to buffer
                        const buffer = Buffer.from(await file.arrayBuffer());
                        
                        // Upload to object storage
                        const user = security.getUser();
                        const schoolId = user.schoolId?.toString() || 'default';
                        const objectKey = `${schoolId}/coursemap/${courseMapItemId}/${uniqueFileName}`;
                        await uploadBufferHelper(buffer, 'schools', objectKey, file.type);

                        // Create resource in database (no description since we're auto-inferring everything)
                        const resource = await createResource(
                                name,
                                file.name,
                                objectKey,
                                file.type,
                                file.size,
                                resourceType,
                                security.getUser().id,
                                undefined // No description
                        );

                        // Link resource to course map item
                        await addResourceToCourseMapItem(courseMapItemId, resource.id);

                        return { success: true, resource };
                } catch (error) {
                        console.error('Error uploading resource:', error);
                        return fail(500, { message: 'Failed to upload resource' });
                }
        }
};
