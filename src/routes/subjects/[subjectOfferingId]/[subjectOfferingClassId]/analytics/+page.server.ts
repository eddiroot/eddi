import { db } from '$lib/server/db/index.js';
import { subject } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
	const subjectOfferingId = parseInt(params.subjectOfferingId);

	if (isNaN(subjectOfferingId)) {
		throw error(400, 'Invalid subject offering ID');
	}

	const subjectData = await db.query.subject.findFirst({
		where: eq(subject.id, subjectOfferingId)
	});

	if (!subjectData) {
		throw error(404, 'Subject not found');
	}

	return {
		subject: subjectData
	};
};
