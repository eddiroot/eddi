import { requireLogin } from '$lib/server/auth';
import { getSubjectsByUserId } from '$lib/server/db/service';

export const load = async () => {
	const user = requireLogin();
	const subjects = await getSubjectsByUserId(user.id);

	return { user, subjects };
};
