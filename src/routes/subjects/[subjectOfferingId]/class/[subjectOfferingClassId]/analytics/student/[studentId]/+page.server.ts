import { db } from '$lib/server/db/index.js';
import { subject } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const subjectOfferingId = parseInt(params.subjectOfferingId, 10);
	const subjectOfferingClassId = parseInt(params.subjectOfferingClassId, 10);
	const studentId = parseInt(params.studentId, 10);

	if (isNaN(subjectOfferingId)) {
		throw error(400, 'Invalid subject offering ID');
	}

	if (isNaN(subjectOfferingClassId)) {
		throw error(400, 'Invalid subject offering class ID');
	}

	if (isNaN(studentId)) {
		throw error(400, 'Invalid student ID');
	}

	const subjectData = await db.query.subject.findFirst({
		where: eq(subject.id, subjectOfferingId)
	});

	if (!subjectData) {
		throw error(404, 'Subject not found');
	}

	// TODO: Add actual student data fetching from database
	const mockStudents = [
		{ id: 1, firstName: 'Sam', lastName: 'Smith', avatarUrl: '/avatars/sam.jpg' },
		{ id: 2, firstName: 'Emma', lastName: 'Johnson', avatarUrl: '/avatars/emma.jpg' },
		{ id: 3, firstName: 'Michael', lastName: 'Chen', avatarUrl: '/avatars/michael.jpg' },
		{ id: 4, firstName: 'Sarah', lastName: 'Davis', avatarUrl: '/avatars/sarah.jpg' },
		{ id: 5, firstName: 'David', lastName: 'Wilson', avatarUrl: '/avatars/david.jpg' },
		{ id: 6, firstName: 'Lisa', lastName: 'Martinez', avatarUrl: '/avatars/lisa.jpg' },
		{ id: 7, firstName: 'James', lastName: 'Brown', avatarUrl: '/avatars/james.jpg' },
		{ id: 8, firstName: 'Ashley', lastName: 'Taylor', avatarUrl: '/avatars/ashley.jpg' }
	];

	const mockStudent = mockStudents.find((s) => s.id === studentId) || {
		id: studentId,
		firstName: 'Student',
		lastName: `${studentId}`,
		avatarUrl: '/avatars/default.jpg'
	};

	return {
		subject: subjectData,
		subjectOfferingClassId,
		studentId,
		student: mockStudent
	};
};
