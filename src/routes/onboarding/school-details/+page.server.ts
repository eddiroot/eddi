import { fail, redirect } from '@sveltejs/kit';
import { createCampus, updateSchool} from '$lib/server/db/service/schools';
import { createAdminUser } from '$lib/server/db/service/schools';
import { db } from '$lib/server/db';
import { school } from '$lib/server/db/schema';

export const actions = {
    default: async ({ request, locals }) => {
        const form = await request.formData();
        const name = form.get('schoolName')?.toString().trim();
        const address = form.get('schoolAddress')?.toString().trim();
        const email = form.get('schoolEmail')?.toString().trim();
        const phone = form.get('schoolPhone')?.toString().trim();
        // logo handling omitted for now

        const errors: Record<string, string> = {};
        if (!name) errors.schoolName = 'School name is required';
        if (!address) errors.schoolAddress = 'School address is required';
        if (!email) errors.schoolEmail = 'School email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) errors.schoolEmail = 'Please enter a valid email address';

        if (Object.keys(errors).length > 0) {
            return fail(400, { errors });
        }

        // Create the school
        const [newSchool] = await db.insert(school).values({ name, emailSuffix: email }).returning();
        if (!newSchool) {
            return fail(500, { errors: { general: 'Failed to create school.' } });
        }

        // Store the schoolId in locals or session for the next step
        locals.schoolId = newSchool.id;

        // Redirect to admin user creation
        throw redirect(303, '/onboarding/self-setup/admin-users');
    }
}; 