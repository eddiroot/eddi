import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subjectOfferingClassResource } from '$lib/server/db/schema/subjects';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params, locals }) => {
    if (!locals.user) {
        throw error(401, 'Unauthorized');
    }

    const resourceId = parseInt(params.resourceId);
    if (isNaN(resourceId)) {
        throw error(400, 'Invalid resource ID');
    }

    try {
        // Check if the resource exists and get its details
        const resource = await db
            .select()
            .from(subjectOfferingClassResource)
            .where(eq(subjectOfferingClassResource.id, resourceId))
            .limit(1);

        if (resource.length === 0) {
            throw error(404, 'Resource not found');
        }

        // TODO: Add authorization check - ensure user can delete this resource
        // This might involve checking if they're the author or have teacher permissions

        // Delete the resource from the database
        await db
            .delete(subjectOfferingClassResource)
            .where(eq(subjectOfferingClassResource.id, resourceId));

        // TODO: Also delete the actual file from storage
        // You'll need to implement file deletion based on your storage system
        // Example: await deleteFileFromStorage(resource[0].fileName);

        return new Response(null, { status: 204 });
    } catch (err) {
        console.error('Error deleting resource:', err);
        throw error(500, 'Failed to delete resource');
    }
};
