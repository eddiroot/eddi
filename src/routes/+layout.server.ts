import { getSubjectsByUserId } from '$lib/server/db/service.js';
import * as auth from '$lib/server/auth.js';
import { fail, redirect } from '@sveltejs/kit';
import { handleChatRequest } from '$lib/components/ai-sidebar/ai-sidebar.server.js';

export const load = async ({ locals: { user }  }) => {
	if (!user) {
		return { user: null, subjects: [] };
	}

	// Needed to populate the sidebar
	const subjects = await getSubjectsByUserId(user.id);

	return {
		user,
		subjects
	};
};

