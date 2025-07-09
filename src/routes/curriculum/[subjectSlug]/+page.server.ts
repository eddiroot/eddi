import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getCoreSubjectsBySchoolId,
	getCourseMapItemsByCoreSubjectId,
	getSubjectsByCoreSubjectId
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	const coreSubjects = await getCoreSubjectsBySchoolId(locals.user.schoolId);
	const coreSubject = coreSubjects.find(
		(s: { name: string }) => s.name.toLowerCase().replace(/\s+/g, '-') === params.subjectSlug
	);

	if (!coreSubject) {
		throw error(404, 'Core subject not found');
	}

	// Get URL parameters - default to multi-year view for core subject overview
	const selectedYearLevel = url.searchParams.get('year') || 'F';
	const viewMode = 'multi'; // Always default to multi-view for core subjects
	const academicYear = parseInt(
		url.searchParams.get('academicYear') || new Date().getFullYear().toString()
	);

	// Get course map items for this core subject
	const courseMapItems = await getCourseMapItemsByCoreSubjectId(coreSubject.id);

	// Get subjects for this core subject to determine available year levels
	const subjects = await getSubjectsByCoreSubjectId(coreSubject.id);
	const availableYearLevels = [...new Set(subjects.map((s) => s.yearLevel))].sort();

	// For now, set lessons to empty array since we're working with core subjects
	// TODO: Implement lesson loading based on core subjects and their related subjects
	const lessons: unknown[] = [];

	// For now, set learning areas to empty array since we're working with core subjects
	// TODO: Implement learning area loading based on core subjects
	const learningAreas: unknown[] = [];
	console.log('🔍 Server debug - Learning areas count:', learningAreas.length);

	// For now, set learning area content to empty array
	const learningAreaContent: unknown[] = [];

	console.log('🔍 Server debug - Learning area content count:', learningAreaContent.length);

	return {
		subject: coreSubject,
		courseMapItems,
		lessons,
		learningAreas,
		learningAreaContent,
		selectedYearLevel,
		viewMode,
		academicYear,
		availableYearLevels,
		user: locals.user
	};
};

export const actions: Actions = {
	create: async ({ locals, params }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const coreSubjects = await getCoreSubjectsBySchoolId(locals.user.schoolId);
		const coreSubject = coreSubjects.find(
			(s: { name: string }) => s.name.toLowerCase().replace(/\s+/g, '-') === params.subjectSlug
		);

		if (!coreSubject) {
			return fail(404, { message: 'Core subject not found' });
		}

		// TODO: Implement proper relationship between core subjects and individual subjects
		// For now, we'll return an error since course map items belong to individual subjects
		return fail(400, {
			message:
				'Course map item creation not yet supported for core subjects. Please create items at the individual subject level.'
		});
	},

	update: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		// TODO: Implement proper relationship between core subjects and individual subjects
		// For now, we'll return an error since course map items belong to individual subjects
		return fail(400, {
			message:
				'Course map item update not yet supported for core subjects. Please update items at the individual subject level.'
		});
	},

	delete: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		// TODO: Implement proper relationship between core subjects and individual subjects
		// For now, we'll return an error since course map items belong to individual subjects
		return fail(400, {
			message:
				'Course map item deletion not yet supported for core subjects. Please delete items at the individual subject level.'
		});
	}
};
