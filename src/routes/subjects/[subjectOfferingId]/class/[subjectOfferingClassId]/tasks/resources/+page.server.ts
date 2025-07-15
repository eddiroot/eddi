import { error } from '@sveltejs/kit';
import { getResourcesBySubjectOfferingClassId, getClassById } from '$lib/server/db/service';
import { getPresignedUrl } from '$lib/server/obj';

export const load = async ({ locals: { security }, params: { subjectOfferingId, subjectOfferingClassId }, setHeaders }) => {
    const user = security.isAuthenticated().getUser();

    // Disable all caching to ensure fresh data
    setHeaders({
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache',
        'expires': '0'
    });

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

        // Generate presigned URLs for each resource
        const resourcesWithUrls = await Promise.all(
            resources.map(async (row) => {
                try {
                    const downloadUrl = await getPresignedUrl(
                        user.schoolId.toString(),
                        row.resource.storedFileName,
                        7 * 24 * 60 * 60 // 7 days expiry
                    );
                    return {
                        ...row.resource,
                        author: row.author,
                        downloadUrl
                    };
                } catch (error) {
                    console.error(`Failed to generate URL for resource ${row.resource.id}:`, error);
                    return {
                        ...row.resource,
                        author: row.author,
                        downloadUrl: null
                    };
                }
            })
        );

        return {
            classDetails,
            resources: resourcesWithUrls
        };
    } catch (err) {
        console.error('Error loading resources:', err);
        throw error(500, 'Failed to load resources');
    }
};
