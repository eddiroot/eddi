import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getCoreSubjectsBySchoolId,
	getSubjectsBySchoolId,
	getCourseMapItemsBySubjectId,
	createCourseMapItem,
	updateCourseMapItem,
	deleteCourseMapItem,
	getLearningAreasBySubject,
	getLearningAreaContent
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	// Get core subjects and find the matching one
	const coreSubjects = await getCoreSubjectsBySchoolId(locals.user.schoolId);
	const coreSubject = coreSubjects.find(
		(s: { name: string }) => s.name.toLowerCase().replace(/\s+/g, '-') === params.subjectSlug
	);

	if (!coreSubject) {
		throw error(404, 'Core subject not found');
	}

	// Get all subjects for this school and find the specific year level subject
	const allSubjects = await getSubjectsBySchoolId(locals.user.schoolId);
	const subject = allSubjects.find(
		(s: { coreSubjectId: number; yearLevel: string }) =>
			s.coreSubjectId === coreSubject.id &&
			s.yearLevel.toUpperCase() === params.yearLevel.toUpperCase()
	);

	if (!subject) {
		throw error(404, `Subject not found for ${coreSubject.name} Year ${params.yearLevel}`);
	}

	// Get URL parameters
	const selectedYearLevel = params.yearLevel.toUpperCase();
	const viewMode = 'single'; // Individual subject pages are always single year view
	const academicYear = parseInt(
		url.searchParams.get('academicYear') || new Date().getFullYear().toString()
	);

	// Get course map items for this specific subject
	const courseMapItems = await getCourseMapItemsBySubjectId(subject.id);

	// Get learning areas and content for this subject and year
	const learningAreas = await getLearningAreasBySubject(subject.id, academicYear);
	const learningAreaContent = await getLearningAreaContent(
		subject.id,
		academicYear,
		selectedYearLevel
	);

	// For now, set lessons to empty array since we haven't implemented lesson loading yet
	const lessons: unknown[] = [];

	return {
		coreSubject,
		subject,
		courseMapItems,
		lessons,
		learningAreas,
		learningAreaContent,
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

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const yearLevel = formData.get('yearLevel') as string;
		const termNumber = parseInt(formData.get('termNumber') as string);
		const academicYear = parseInt(formData.get('academicYear') as string);
		const startWeekNumber = parseInt(formData.get('startWeekNumber') as string);
		const lengthInWeeks = parseInt(formData.get('lengthInWeeks') as string);
		const learningAreaIdStr = formData.get('learningAreaId') as string;
		const learningAreaId = learningAreaIdStr ? parseInt(learningAreaIdStr) : null;

		if (
			!title ||
			!yearLevel ||
			!termNumber ||
			!academicYear ||
			!startWeekNumber ||
			!lengthInWeeks
		) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			// Get the subject for this core subject and year level
			const coreSubjects = await getCoreSubjectsBySchoolId(locals.user.schoolId);
			const coreSubject = coreSubjects.find(
				(s: { name: string }) => s.name.toLowerCase().replace(/\s+/g, '-') === params.subjectSlug
			);

			if (!coreSubject) {
				return fail(404, { message: 'Core subject not found' });
			}

			const allSubjects = await getSubjectsBySchoolId(locals.user.schoolId);
			const subject = allSubjects.find(
				(s: { coreSubjectId: number; yearLevel: string }) =>
					s.coreSubjectId === coreSubject.id &&
					s.yearLevel.toUpperCase() === params.yearLevel.toUpperCase()
			);

			if (!subject) {
				return fail(404, {
					message: `Subject not found for ${coreSubject.name} Year ${params.yearLevel}`
				});
			}

			await createCourseMapItem({
				subjectId: subject.id,
				title,
				description,
				yearLevel,
				termNumber,
				academicYear,
				startWeekNumber,
				lengthInWeeks,
				learningAreaId: learningAreaId || undefined
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

		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const yearLevel = formData.get('yearLevel') as string;
		const termNumber = parseInt(formData.get('termNumber') as string);
		const academicYear = parseInt(formData.get('academicYear') as string);
		const startWeekNumber = parseInt(formData.get('startWeekNumber') as string);
		const lengthInWeeks = parseInt(formData.get('lengthInWeeks') as string);
		const learningAreaIdStr = formData.get('learningAreaId') as string;
		const learningAreaId = learningAreaIdStr ? parseInt(learningAreaIdStr) : null;

		if (
			!id ||
			!title ||
			!yearLevel ||
			!termNumber ||
			!academicYear ||
			!startWeekNumber ||
			!lengthInWeeks
		) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			await updateCourseMapItem(id, {
				title,
				description,
				yearLevel,
				termNumber,
				academicYear,
				startWeekNumber,
				lengthInWeeks,
				learningAreaId: learningAreaId || undefined
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

		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);

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
