import { z } from 'zod/v4';

export const rsvpSchema = z.object({
	willAttend: z.boolean()
});
