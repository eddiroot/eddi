import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and} from 'drizzle-orm';
// Resource management functions
export async function createResource(
    name: string,
    fileName: string,
    objectKey: string,
    contentType: string,
    fileSize: number,
    resourceType: string,
    uploadedBy: string,
    description?: string,
    bucketName: string = 'schools'
) {
    const [resource] = await db
        .insert(table.resource)
        .values({
            fileName,
            objectKey,
            bucketName,
            contentType,
            fileSize,
            resourceType,
            uploadedBy
        })
        .returning();

    return resource;
}

export async function getResourceById(resourceId: number) {
    const [resource] = await db
        .select()
        .from(table.resource)
        .where(
            and(
                eq(table.resource.id, resourceId),
                eq(table.resource.isActive, true)
            )
        )
        .limit(1);

    return resource || null;
}

export async function deleteResource(resourceId: number) {
    const [resource] = await db
        .update(table.resource)
        .set({ isActive: false })
        .where(eq(table.resource.id, resourceId))
        .returning();

    return resource;
}