import { getResourceById } from '$lib/server/db/service';
import { getPresignedUrl } from '$lib/server/obj';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals: { security } }) => {
	security.isAuthenticated();

	const resourceId = parseInt(url.searchParams.get('resourceId') || '');
	const action = url.searchParams.get('action');

	if (isNaN(resourceId)) {
		return json({ error: 'Invalid resource ID' }, { status: 400 });
	}

	try {
		const resource = await getResourceById(resourceId);

		if (!resource) {
			return json({ error: 'Resource not found' }, { status: 404 });
		}

		if (action === 'download') {
			// Generate presigned URL for download
			const user = security.getUser();
			const schoolId = user.schoolId?.toString() || 'default';

			// Object key format: schoolId/coursemap/courseMapItemId/filename
			const objectName = resource.objectKey.startsWith(schoolId)
				? resource.objectKey.substring(schoolId.length + 1)
				: resource.objectKey;

			const presignedUrl = await getPresignedUrl(schoolId, objectName);

			return json({
				downloadUrl: presignedUrl,
				fileName: resource.fileName,
				contentType: resource.contentType
			});
		}

		return json({ resource });
	} catch (error) {
		console.error('Error handling resource request:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
