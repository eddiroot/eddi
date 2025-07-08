import { getSubjectsBySchoolId } from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { validateCSVFile, parseCSVData } from '$lib/utils.js';
import { db } from '$lib/server/db/index.js';
import { subject } from '$lib/server/db/schema.js';
import { subjectsImportSchema } from './schema.js';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const subjects = await getSubjectsBySchoolId(user.schoolId);
	const form = await superValidate(zod(subjectsImportSchema));
	return { subjects, form };
};

const requiredColumns = ['name', 'description'];
const optionalColumns: string[] = [];

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod(subjectsImportSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const file = form.data.file;

			const validationResult = await validateCSVFile(file, requiredColumns, optionalColumns);

			if (!validationResult.isValid) {
				return fail(400, {
					form,
					error: 'CSV validation failed',
					validation: validationResult
				});
			}

			const csvText = await file.text();
			const csvData = parseCSVData(csvText);

			if (csvData.length === 0) {
				return fail(400, {
					form,
					error: 'CSV file contains no valid data rows',
					validation: validationResult
				});
			}

			const subjectsToInsert: Array<{
				name: string;
				description: string | null;
				schoolId: number;
			}> = [];

			for (const rowData of csvData) {
				const name = rowData['name']?.trim();
				const description = rowData['description']?.trim() || null;

				if (!name) {
					continue;
				}

				subjectsToInsert.push({
					name,
					description,
					schoolId: user.schoolId
				});
			}

			if (subjectsToInsert.length === 0) {
				return fail(400, {
					form,
					error: 'No valid subjects found in CSV file',
					validation: validationResult
				});
			}

			const insertedSubjects = await db.insert(subject).values(subjectsToInsert).returning({
				id: subject.id,
				name: subject.name,
				description: subject.description,
				schoolId: subject.schoolId,
				createdAt: subject.createdAt,
				updatedAt: subject.updatedAt
			});

			return withFiles({
				form,
				success: true,
				message: `Successfully imported ${insertedSubjects.length} subjects`,
				data: {
					imported: insertedSubjects.length,
					subjects: insertedSubjects
				}
			});
		} catch (err) {
			console.error('Error importing subjects:', err);
			return fail(500, { form, error: 'Failed to import subjects' });
		}
	}
};
