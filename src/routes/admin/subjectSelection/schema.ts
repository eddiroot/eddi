import { z } from 'zod';

export const createConstraintSchema = z
	.object({
		yearLevel: z.string().min(1, 'Year level is required'),
		year: z.coerce.number().int().min(2020, 'Year must be 2020 or later'),
		name: z.string().min(1, 'Constraint name is required').max(255, 'Name too long'),
		description: z.string().max(500, 'Description too long').optional(),
		min: z.coerce
			.number()
			.int()
			.min(0, 'Minimum must be 0 or greater')
			.max(100, 'Minimum cannot exceed 100'),
		max: z.preprocess((val) => {
			if (!val || val === '' || val === null) return null;
			if (typeof val === 'number') return val;
			const num = parseInt(String(val));
			return isNaN(num) ? null : num;
		}, z.number().int().min(0, 'Maximum must be 0 or greater').max(100, 'Maximum cannot exceed 100').nullable()),
		subjectIds: z.array(z.coerce.number().int().positive()).min(1, 'Select at least one subject')
	})
	.refine(
		(data) => {
			if (data.max === null || data.max === undefined) return true;
			return data.max >= data.min;
		},
		{
			message: 'Maximum must be greater than or equal to minimum',
			path: ['max']
		}
	)
	.refine(
		(data) => {
			// If min is 0 and max is null/undefined, the constraint is meaningless
			if (data.min === 0 && (data.max === null || data.max === undefined)) {
				return false;
			}
			return true;
		},
		{
			message:
				'A constraint with minimum 0 and no maximum is pointless. Either set a minimum > 0 or specify a maximum.',
			path: ['min']
		}
	);

export const updateConstraintSchema = z
	.object({
		constraintId: z.coerce.number().int().positive(),
		name: z.string().min(1, 'Constraint name is required').max(255, 'Name too long'),
		description: z.string().max(500, 'Description too long').optional(),
		min: z.coerce
			.number()
			.int()
			.min(0, 'Minimum must be 0 or greater')
			.max(100, 'Minimum cannot exceed 100'),
		max: z.preprocess((val) => {
			if (!val || val === '' || val === null) return null;
			if (typeof val === 'number') return val;
			const num = parseInt(String(val));
			return isNaN(num) ? null : num;
		}, z.number().int().min(0, 'Maximum must be 0 or greater').max(100, 'Maximum cannot exceed 100').nullable()),
		subjectIds: z.array(z.coerce.number().int().positive()).min(1, 'Select at least one subject')
	})
	.refine(
		(data) => {
			if (data.max === null || data.max === undefined) return true;
			return data.max >= data.min;
		},
		{
			message: 'Maximum must be greater than or equal to minimum',
			path: ['max']
		}
	)
	.refine(
		(data) => {
			// If min is 0 and max is null/undefined, the constraint is meaningless
			if (data.min === 0 && (data.max === null || data.max === undefined)) {
				return false;
			}
			return true;
		},
		{
			message:
				'A constraint with minimum 0 and no maximum is pointless. Either set a minimum > 0 or specify a maximum.',
			path: ['min']
		}
	);

export const deleteConstraintSchema = z.object({
	constraintId: z.coerce.number().int().positive()
});

export type CreateConstraintSchema = typeof createConstraintSchema;
export type UpdateConstraintSchema = typeof updateConstraintSchema;
export type DeleteConstraintSchema = typeof deleteConstraintSchema;
