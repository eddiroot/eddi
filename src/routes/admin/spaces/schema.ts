import { z } from 'zod/v4';

export const requiredColumns = ['name', 'type', 'buildingName'];
export const optionalColumns: string[] = ['capacity', 'description'];

export const locationsImportSchema = z.object({
	file: z
		.instanceof(File)
		.refine((file) => file.size > 0, 'Please select a CSV file')
		.refine((file) => file.size <= 10 * 1024 * 1024, 'File must be smaller than 10MB')
		.refine(
			(file) => file.type === 'text/csv' || file.name.endsWith('.csv'),
			'File must be a CSV file'
		)
});

export type LocationsImportSchema = typeof locationsImportSchema;
