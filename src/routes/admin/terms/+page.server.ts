import {
	createSchoolTerm,
	deleteSchoolTerm,
	getSemestersWithTermsBySchoolIdForYear,
	updateSchoolTerm
} from '$lib/server/db/service/schools';
import { fail } from '@sveltejs/kit';
import Holidays from 'date-holidays';

export const load = async ({ locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const semestersWithTerms = await getSemestersWithTermsBySchoolIdForYear(
		security.getUser().schoolId,
		new Date().getFullYear()
	);

	// Get Victoria public holidays
	const hd = new Holidays('AU', 'VIC');
	const currentYear = new Date().getFullYear();

	// Get holidays for current year and next year to cover all potential terms
	const holidaysThisYear = hd.getHolidays(currentYear);

	// Combine and format the holidays
	const publicHolidays = [...holidaysThisYear].map((holiday) => ({
		date: holiday.date,
		name: holiday.name,
		type: holiday.type
	}));

	return {
		semestersWithTerms,
		publicHolidays,
		currentYear
	};
};

export const actions = {
	changeYear: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isSchoolAdmin();

		const formData = await request.formData();
		const year = parseInt(formData.get('year') as string);

		// Get semesters and terms for the selected year
		const semestersWithTerms = await getSemestersWithTermsBySchoolIdForYear(
			security.getUser().schoolId,
			year
		);

		// Get Victoria public holidays for the selected year
		const hd = new Holidays('AU', 'VIC');
		const holidays = hd.getHolidays(year);

		const publicHolidays = holidays.map((holiday) => ({
			date: holiday.date,
			name: holiday.name,
			type: holiday.type
		}));

		return {
			success: true,
			semestersWithTerms: semestersWithTerms || [],
			publicHolidays: publicHolidays || [],
			currentYear: year
		};
	},

	createTerm: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isSchoolAdmin();

		const formData = await request.formData();
		const semesterId = parseInt(formData.get('semesterId') as string);
		const name = formData.get('name') as string;
		const startDate = new Date(formData.get('startDate') as string);
		const endDate = new Date(formData.get('endDate') as string);
		const currentYear = parseInt(formData.get('currentYear') as string);

		// Validate dates
		if (startDate >= endDate) {
			return fail(400, { error: 'End date must be after start date' });
		}

		try {
			await createSchoolTerm(semesterId, name, startDate, endDate);

			// Refetch data
			const semestersWithTerms = await getSemestersWithTermsBySchoolIdForYear(
				security.getUser().schoolId,
				currentYear
			);

			const hd = new Holidays('AU', 'VIC');
			const holidays = hd.getHolidays(currentYear);
			const publicHolidays = holidays.map((holiday) => ({
				date: holiday.date,
				name: holiday.name,
				type: holiday.type
			}));

			return {
				success: true,
				semestersWithTerms: semestersWithTerms || [],
				publicHolidays: publicHolidays || [],
				currentYear
			};
		} catch (error) {
			console.error('Failed to create term:', error);
			return fail(500, { error: 'Failed to create term' });
		}
	},

	updateTerm: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isSchoolAdmin();

		const formData = await request.formData();
		const termId = parseInt(formData.get('termId') as string);
		const name = formData.get('name') as string;
		const startDate = new Date(formData.get('startDate') as string);
		const endDate = new Date(formData.get('endDate') as string);
		const currentYear = parseInt(formData.get('currentYear') as string);

		// Validate dates
		if (startDate >= endDate) {
			return fail(400, { error: 'End date must be after start date' });
		}

		try {
			await updateSchoolTerm(termId, { name, startDate, endDate });

			// Refetch data
			const semestersWithTerms = await getSemestersWithTermsBySchoolIdForYear(
				security.getUser().schoolId,
				currentYear
			);

			const hd = new Holidays('AU', 'VIC');
			const holidays = hd.getHolidays(currentYear);
			const publicHolidays = holidays.map((holiday) => ({
				date: holiday.date,
				name: holiday.name,
				type: holiday.type
			}));

			return {
				success: true,
				semestersWithTerms: semestersWithTerms || [],
				publicHolidays: publicHolidays || [],
				currentYear
			};
		} catch (error) {
			console.error('Failed to update term:', error);
			return fail(500, { error: 'Failed to update term' });
		}
	},

	deleteTerm: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isSchoolAdmin();

		const formData = await request.formData();
		const termId = parseInt(formData.get('termId') as string);
		const currentYear = parseInt(formData.get('currentYear') as string);

		try {
			await deleteSchoolTerm(termId);

			// Refetch data
			const semestersWithTerms = await getSemestersWithTermsBySchoolIdForYear(
				security.getUser().schoolId,
				currentYear
			);

			const hd = new Holidays('AU', 'VIC');
			const holidays = hd.getHolidays(currentYear);
			const publicHolidays = holidays.map((holiday) => ({
				date: holiday.date,
				name: holiday.name,
				type: holiday.type
			}));

			return {
				success: true,
				semestersWithTerms: semestersWithTerms || [],
				publicHolidays: publicHolidays || [],
				currentYear
			};
		} catch (error) {
			console.error('Failed to delete term:', error);
			return fail(500, { error: 'Failed to delete term' });
		}
	}
};
