import { requireLogin } from '$lib/server/auth';
import { getSubjectsByUserId } from '$lib/server/db/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const user = requireLogin();
	const subjects = await getSubjectsByUserId(user.id);

	return { user, subjects };
};
