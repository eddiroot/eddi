import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { rsvpSchema } from '../../../schemas';
import {
    getSchoolEventById,
    getCampusEventById,
    getSubjectOfferingEventById,
    getSubjectOfferingClassEventById,
    getEventRSVP,
    createOrUpdateEventRSVP
} from '$lib/server/db/service/events';

export const load = async ({ params, locals: { security } }) => {
    const user = security.isAuthenticated().getUser();

    const { eventType, eventId } = params;
    const eventIdNum = parseInt(eventId as string, 10);

    if (isNaN(eventIdNum)) {
        throw redirect(302, '/timetable');
    }

    // Get event details based on type
    let event;
    try {
        switch (eventType) {
            case 'school':
                event = await getSchoolEventById(eventIdNum);
                break;
            case 'campus':
                event = await getCampusEventById(eventIdNum);
                break;
            case 'subject':
                event = await getSubjectOfferingEventById(eventIdNum);
                break;
            case 'class':
                event = await getSubjectOfferingClassEventById(eventIdNum);
                break;
            default:
                throw redirect(302, '/timetable');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        throw redirect(302, '/timetable');
    }

    if (!event || !event.requiresRSVP) {
        throw redirect(302, '/timetable');
    }

    // Get existing RSVP
    const existingRSVP = await getEventRSVP(
        user.id,
        eventType as 'school' | 'campus' | 'subject' | 'class',
        eventIdNum
    );

    const form = await superValidate(
        { willAttend: existingRSVP?.willAttend ?? false },
        zod4(rsvpSchema)
    );

    return {
        form,
        event,
        eventType,
        eventId: eventIdNum,
        hasExistingRSVP: !!existingRSVP
    };
};

export const actions = {
    default: async ({ request, params, locals: { security } }) => {
        const user = security.isAuthenticated().getUser();

        const { eventType, eventId } = params;
        const eventIdNum = parseInt(eventId as string, 10);

        if (isNaN(eventIdNum)) {
            return fail(400, { message: 'Invalid event ID' });
        }

        const form = await superValidate(request, zod4(rsvpSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            await createOrUpdateEventRSVP(
                user.id,
                eventType as 'school' | 'campus' | 'subject' | 'class',
                eventIdNum,
                form.data.willAttend
            );

        } catch (error) {
            console.error('Error creating RSVP:', error);
            return fail(500, {
                form,
                message: 'Failed to save RSVP. Please try again.'
            });
        }

        redirect(302, '/timetable?rsvp=success');
    }
};
