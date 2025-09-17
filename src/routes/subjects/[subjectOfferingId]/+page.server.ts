import { getSubjectsWithClassesByUserId } from '$lib/server/db/service';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();
	const user = security.isAuthenticated().getUser();

	// Get all subjects with classes for the user
	const subjectsWithClasses = await getSubjectsWithClassesByUserId(user.id);

	// Find the subject offering that matches our parameter
	const subjectOfferingIdInt = Number(subjectOfferingId);
	const targetSubject = subjectsWithClasses.find(
		(subject) => subject.subjectOffering.id === subjectOfferingIdInt
	);

	// If subject not found or no classes, redirect to dashboard
	if (!targetSubject || targetSubject.classes.length === 0) {
		throw redirect(302, '/dashboard');
	}

	// Redirect to the first class the user is enrolled in for this subject offering
	// Note: Usually there should only be one class per student per subject offering
	const userClass = targetSubject.classes[0];
	throw redirect(302, `/subjects/${subjectOfferingId}/class/${userClass.id}`);
};
