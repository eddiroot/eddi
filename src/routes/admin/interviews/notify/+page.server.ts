import { InterviewService } from '$lib/server/db/service/interviews';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const config = await InterviewService.getConfigBySchoolId(user.schoolId);
	return { config };
};

export const actions: Actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();
		const formData = await request.formData();
		const action = formData.get('action');
		if (action === 'notify_teachers') {
			return redirect(302, '/interviews');
		}
		return fail(400, { error: 'Invalid action' });
	}
};
