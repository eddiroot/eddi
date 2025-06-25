import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { handleChatRequest } from '$lib/components/ai-sidebar/ai-sidebar.server.js';

export const actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/auth/login');
	},
	chatbot: async (event) => {
		try {
			const formData = await event.request.formData();
			const message = formData.get('message')?.toString();
			
			if (!message) {
				return fail(400, { error: 'Message is required' });
			}

			// Create a new request object with JSON body for the chatbot handler
			const jsonRequest = new Request(event.request.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message,
					conversationHistory: [] // For now, we'll handle history on the client side
				})
			});

			// Create a new event object with the JSON request
			const chatEvent = {
				...event,
				request: jsonRequest
			};

			const response = await handleChatRequest(chatEvent);
			const responseData = await response.json();
			console.log('Chatbot response:', responseData);
			return responseData;
		} catch (error) {
			console.error('Error in chatbot action:', error);
			return fail(500, { error: 'Internal server error' });
		}
	}
};
