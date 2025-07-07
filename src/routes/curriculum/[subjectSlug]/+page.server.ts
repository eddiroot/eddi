import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getSubjectsBySchoolId,
	getCourseMapItemsBySubjectId,
	createCourseMapItem,
	updateCourseMapItem,
	deleteCourseMapItem
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	const subjects = await getSubjectsBySchoolId(locals.user.schoolId);
	const subject = subjects.find(
		(s: { name: string }) => s.name.toLowerCase().replace(/\s+/g, '-') === params.subjectSlug
	);

	if (!subject) {
		throw error(404, 'Subject not found');
	}

	// Get URL parameters
	const selectedYearLevel = url.searchParams.get('year') || 'F';
	const viewMode = (url.searchParams.get('view') as 'single' | 'multi') || 'single';
	const academicYear = parseInt(
		url.searchParams.get('academicYear') || new Date().getFullYear().toString()
	);

	// Get course map items for this subject
	const courseMapItems = await getCourseMapItemsBySubjectId(subject.id);

	return {
		subject,
		subjects,
		courseMapItems,
		selectedYearLevel,
		viewMode,
		academicYear,
		user: locals.user
	};
};

export const actions: Actions = {
	create: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const subjects = await getSubjectsBySchoolId(locals.user.schoolId);
		const subject = subjects.find(
			(s: { name: string }) => s.name.toLowerCase().replace(/\s+/g, '-') === params.subjectSlug
		);

		if (!subject) {
			return fail(404, { message: 'Subject not found' });
		}

		const data = await request.formData();
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const yearLevel = data.get('yearLevel') as string;
		const termNumber = parseInt(data.get('termNumber') as string);
		const academicYear = parseInt(data.get('academicYear') as string);
		const startWeekNumber = parseInt(data.get('startWeekNumber') as string);
		const lengthInWeeks = parseInt(data.get('lengthInWeeks') as string);

		if (!title || !yearLevel || !termNumber || !startWeekNumber || !lengthInWeeks) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			await createCourseMapItem({
				title,
				description: description || undefined,
				subjectId: subject.id,
				yearLevel,
				termNumber,
				academicYear,
				startWeekNumber,
				lengthInWeeks,
				orderIndex: 0
			});

			return { success: true };
		} catch (error) {
			console.error('Error creating course map item:', error);
			return fail(500, { message: 'Failed to create course map item' });
		}
	},

	update: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const data = await request.formData();
		const id = parseInt(data.get('id') as string);
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const yearLevel = data.get('yearLevel') as string;
		const termNumber = parseInt(data.get('termNumber') as string);
		const academicYear = parseInt(data.get('academicYear') as string);
		const startWeekNumber = parseInt(data.get('startWeekNumber') as string);
		const lengthInWeeks = parseInt(data.get('lengthInWeeks') as string);

		if (!id || !title || !yearLevel || !termNumber || !startWeekNumber || !lengthInWeeks) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			await updateCourseMapItem(id, {
				title,
				description: description || undefined,
				yearLevel,
				termNumber,
				academicYear,
				startWeekNumber,
				lengthInWeeks
			});

			return { success: true };
		} catch (error) {
			console.error('Error updating course map item:', error);
			return fail(500, { message: 'Failed to update course map item' });
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const data = await request.formData();
		const id = parseInt(data.get('id') as string);

		if (!id) {
			return fail(400, { message: 'Missing course map item ID' });
		}

		try {
			await deleteCourseMapItem(id);
			return { success: true };
		} catch (error) {
			console.error('Error deleting course map item:', error);
			return fail(500, { message: 'Failed to delete course map item' });
		}
	}
};
