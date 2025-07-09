import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import * as service from '$lib/server/db/service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	if (!locals.user.schoolId) {
		redirect(302, '/onboarding');
	}

	// Load core subjects for the curriculum list view (not individual year-level subjects)
	const coreSubjects = await service.getCoreSubjectsBySchoolId(locals.user.schoolId);

	return {
		coreSubjects,
		user: locals.user
	};
};
