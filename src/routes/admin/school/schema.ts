import { z } from 'zod';

export const schoolFormSchema = z.object({
	name: z
		.string({ required_error: 'Please enter a school name' })
		.min(1, 'School name cannot be empty')
		.max(255, 'School name cannot exceed 255 characters'),
	emailSuffix: z
		.string({ required_error: 'Please enter an email suffix' })
		.min(1, 'Email suffix cannot be empty')
		.regex(
			/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
			'Email suffix must be a valid domain (e.g., school.edu)'
		)
		.max(100, 'Email suffix cannot exceed 100 characters')
});

export const logoUploadSchema = z.object({
	logo: z
		.instanceof(File)
		.refine((file) => file.size > 0, 'Please select a logo file')
		.refine((file) => file.size <= 5 * 1024 * 1024, 'Logo file must be smaller than 5MB')
		.refine(
			(file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
			'Logo must be a JPEG, PNG, or WebP image'
		)
});

export type SchoolFormSchema = typeof schoolFormSchema;
export type LogoUploadSchema = typeof logoUploadSchema;
