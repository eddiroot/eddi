import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();
	const user = security.getUser();
};

export const actions = {};
