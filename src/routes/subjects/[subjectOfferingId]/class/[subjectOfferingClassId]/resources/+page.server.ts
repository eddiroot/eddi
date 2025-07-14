import { error } from '@sveltejs/kit';
import { getResourcesBySubjectOfferingClassId, getClassById } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingId, subjectOfferingClassId } }) => {
    security.isAuthenticated();

    // Validate parameters
    const classId = parseInt(subjectOfferingClassId, 10);
    if (isNaN(classId)) {
        throw error(400, 'Invalid class ID');
    }

    try {
        // Get class details to verify it exists and belongs to the subject offering
        const classDetails = await getClassById(classId);
        if (!classDetails) {
            throw error(404, 'Class not found');
        }

        // Verify the class belongs to the subject offering
        if (classDetails.subjectOfferingClass.subOfferingId !== parseInt(subjectOfferingId, 10)) {
            throw error(400, 'Class does not belong to this subject offering');
        }

        // Get resources for this class
        const resources = await getResourcesBySubjectOfferingClassId(classId);

        return {
            classDetails,
            resources: resources.map(row => ({
                ...row.resource,
                author: row.author
            }))
        };
    } catch (err) {
        console.error('Error loading resources:', err);
        throw error(500, 'Failed to load resources');
    }
};
