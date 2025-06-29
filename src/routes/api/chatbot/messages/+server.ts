import { json, type RequestHandler } from '@sveltejs/kit';
import { getChatbotChatById, getChatbotMessagesByChatId } from '$lib/server/db/service';

// This endpoint handles retrieving all messages for a chat.
export const GET: RequestHandler = async (event) => {
	try {
		const url = new URL(event.request.url);
		const chatIdParam = url.searchParams.get('chatId');

		if (!chatIdParam) {
			return json({ error: 'Chat ID is required' }, { status: 400 });
		}

		const chatId = parseInt(chatIdParam, 10);
		if (isNaN(chatId)) {
			return json({ error: 'Invalid Chat ID' }, { status: 400 });
		}

		const user = event.locals.security.getUser();
		if (!user) {
			return json({ error: 'Unauthorised' }, { status: 401 });
		}

		const chat = await getChatbotChatById(chatId);
		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		if (chat.userId !== user.id) {
			return json({ error: 'Forbidden: You do not have access to this chat' }, { status: 403 });
		}

		const messages = await getChatbotMessagesByChatId(chatId);

		return json({ messages }, { status: 200 });
	} catch (error) {
		console.error('Error retrieving messages:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
