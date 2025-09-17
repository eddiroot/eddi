import { newsStatusEnum } from '$lib/enums';
import {
	deleteNews,
	getNewsDraftsByAuthor,
	getNewsResources,
	updateNews
} from '$lib/server/db/service/news';
import { getPermissions, userPermissions } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();

	// Get user's draft news articles
	const drafts = await getNewsDraftsByAuthor(user.id, user.schoolId);

	// Fetch images for each draft
	const draftsWithImages = await Promise.all(
		drafts.map(async (draftItem) => {
			const images = await getNewsResources(draftItem.news.id, user.schoolId);
			return {
				...draftItem,
				images
			};
		})
	);

	return {
		user,
		drafts: draftsWithImages
	};
};

export const actions: Actions = {
	publish: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

		// Check permissions
		const userPerms = getPermissions(user.type);
		if (!userPerms.includes(userPermissions.createNews)) {
			throw error(403, 'You do not have permission to publish news');
		}

		const formData = await request.formData();
		const newsId = parseInt(formData.get('newsId') as string);

		if (isNaN(newsId)) {
			return fail(400, { error: 'Invalid news ID' });
		}

		try {
			// Update the draft to published status
			await updateNews(newsId, {
				status: newsStatusEnum.published,
				publishedAt: new Date()
			});

			throw redirect(303, `/news?published=${newsId}`);
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && err.status === 303) {
				throw err;
			}

			console.error('Error publishing draft:', err);
			return fail(500, { error: 'Failed to publish article. Please try again.' });
		}
	},

	delete: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

		// Check permissions
		const userPerms = getPermissions(user.type);
		if (!userPerms.includes(userPermissions.createNews)) {
			throw error(403, 'You do not have permission to delete news');
		}

		const formData = await request.formData();
		const newsId = parseInt(formData.get('newsId') as string);

		if (isNaN(newsId)) {
			return fail(400, { error: 'Invalid news ID' });
		}

		try {
			// Delete the news article
			await deleteNews(newsId);

			// Use a more explicit redirect with cache invalidation
			throw redirect(303, '/news/drafts?deleted=1');
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && err.status === 303) {
				throw err;
			}

			console.error('Error deleting draft:', err);
			return fail(500, { error: 'Failed to delete article. Please try again.' });
		}
	}
};
