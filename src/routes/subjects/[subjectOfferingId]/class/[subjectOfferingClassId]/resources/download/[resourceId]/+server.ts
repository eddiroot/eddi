import { error } from '@sveltejs/kit';
import { getResourceById } from '$lib/server/db/service';
import { getFileFromStorage } from '$lib/server/obj';

export const GET = async ({ params, locals: { security } }) => {
    const user = security.isAuthenticated().getUser();

    const resourceId = parseInt(params.resourceId, 10);

    if (isNaN(resourceId)) {
        throw error(400, 'Invalid resource ID');
    }

    try {
        // Get resource metadata from database
        const resource = await getResourceById(resourceId);
        if (!resource) {
            throw error(404, 'Resource not found');
        }

        // Get file from storage
        const fileBuffer = await getFileFromStorage(user.schoolId.toString(), resource.storedFileName);
        if (!fileBuffer) {
            throw error(404, 'File not found');
        }

        // Return the file with appropriate headers
        return new Response(fileBuffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${resource.originalFileName}"`,
                'Content-Length': resource.fileSize.toString()
            }
        });
    } catch (err) {
        console.error('Error downloading resource:', err);
        throw error(500, 'Failed to download resource');
    }
};
