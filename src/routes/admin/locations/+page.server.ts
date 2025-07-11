import { getLocationsBySchoolId, getCampusesBySchoolId } from '$lib/server/db/service';
import { superValidate, withFiles, fail } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { validateCSVFile, parseCSVData } from '$lib/utils.js';
import { db } from '$lib/server/db/index.js';
import { schoolLocation, schoolLocationTypeEnum } from '$lib/server/db/schema';
import { optionalColumns, requiredColumns, locationsImportSchema } from './schema.js';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const locations = await getLocationsBySchoolId(user.schoolId);
	const form = await superValidate(zod(locationsImportSchema));
	return { locations, form };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod(locationsImportSchema));

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

			// Get all campuses for this school to validate campus names
			const campuses = await getCampusesBySchoolId(user.schoolId);
			const campusMap = new Map(campuses.map((c) => [c.name.toLowerCase(), c.id]));

			const locationsToInsert: Array<{
				name: string;
				type: (typeof schoolLocationTypeEnum)[keyof typeof schoolLocationTypeEnum];
				campusId: number;
				capacity: number | null;
				description: string | null;
				isArchived: boolean;
			}> = [];

			for (const rowData of csvData) {
				const name = rowData['name']?.trim();
				const type = rowData['type']?.trim().toLowerCase();
				const campusName = rowData['campusname']?.trim();
				const capacityStr = rowData['capacity']?.trim();
				const description = rowData['description']?.trim() || null;

				if (!name || !type || !campusName) {
					continue;
				}

				// Validate campus exists
				const campusId = campusMap.get(campusName.toLowerCase());
				if (!campusId) {
					return fail(400, {
						form,
						error: `Campus "${campusName}" not found. Available campuses: ${campuses.map((c) => c.name).join(', ')}`,
						validation: validationResult
					});
				}

				// Validate location type
				const validTypes = Object.values(schoolLocationTypeEnum);
				const locationTypeValue =
					type as (typeof schoolLocationTypeEnum)[keyof typeof schoolLocationTypeEnum];
				if (!validTypes.includes(locationTypeValue)) {
					return fail(400, {
						form,
						error: `Invalid location type "${type}". Valid types: ${validTypes.join(', ')}`,
						validation: validationResult
					});
				}

				// Parse capacity if provided
				let capacity: number | null = null;
				if (capacityStr && capacityStr !== '') {
					const parsedCapacity = parseInt(capacityStr, 10);
					if (!isNaN(parsedCapacity) && parsedCapacity > 0) {
						capacity = parsedCapacity;
					}
				}

				locationsToInsert.push({
					name,
					type: locationTypeValue,
					campusId,
					capacity,
					description,
					isArchived: false
				});
			}

			if (locationsToInsert.length === 0) {
				return fail(400, {
					form,
					error: 'No valid locations found in CSV file',
					validation: validationResult
				});
			}

			await db.insert(schoolLocation).values(locationsToInsert);

			return withFiles({
				form,
				success: true
			});
		} catch (err) {
			console.error('Error importing locations:', err);
			return fail(500, { form, error: 'Failed to import locations' });
		}
	}
};
