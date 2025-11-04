import { getSubjectsWithClassesByUserId } from '$lib/server/db/service';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();
	const user = security.isAuthenticated().getUser();

	const subjectsWithClasses = await getSubjectsWithClassesByUserId(user.id);

	const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	if (isNaN(subjectOfferingIdInt)) {
		throw redirect(302, '/dashboard');
	}

	const targetSubject = subjectsWithClasses.find(
		(subject) => subject.subjectOffering.id === subjectOfferingIdInt
	);

	if (!targetSubject || targetSubject.classes.length === 0) {
		throw redirect(302, '/dashboard');
	}

	const userClass = targetSubject.classes[0];
	throw redirect(302, `/subjects/${subjectOfferingId}/class/${userClass.id}`);
};
