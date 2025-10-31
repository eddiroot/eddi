import { z } from 'zod';

export const formSchema = z
	.object({
		firstName: z.string().min(1, { message: 'First name is required' }),
		middleName: z.string().optional(),
		lastName: z.string().min(1, { message: 'Last name is required' }),
		email: z.string().email({ message: 'Please enter a valid email address' }).toLowerCase(),
		password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
		confirmPassword: z.string().min(8, { message: 'Please confirm your password' }),
		schoolName: z.string().min(1, { message: 'School name is required' }),
		agreeToContact: z.boolean().refine((val) => val === true, {
			message: 'Please agree to be contacted by our team'
		})
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export type FormSchema = typeof formSchema;
