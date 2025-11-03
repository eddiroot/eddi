import { getSemestersWithTermsBySchoolIdForYear } from '$lib/server/db/service/schools';
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
	}
};
