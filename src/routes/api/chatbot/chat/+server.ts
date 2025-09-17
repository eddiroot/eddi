import { json, type RequestHandler } from '@sveltejs/kit';
import {
	createChatbotChat,
	getChatbotChatById,
	getChatbotChatsWithFirstMessageByUserId
} from '$lib/server/db/service';

// This endpoint handles creating a new chat session.
export const POST: RequestHandler = async (event) => {
	try {
		const user = event.locals.security.getUser();
		if (!user) {
			return json({ error: 'Unauthorised' }, { status: 401 });
		}

		const createdChat = await createChatbotChat(user.id);

		return json({ chat: createdChat }, { status: 201 });
	} catch (error) {
		console.error('Error creating chat:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// This endpoint handles retrieving an existing chat or listing all chats.
export const GET: RequestHandler = async (event) => {
	try {
		const url = new URL(event.request.url);
		const chatIdParam = url.searchParams.get('chatId');

		const user = event.locals.security.getUser();
		if (!user) {
			return json({ error: 'Unauthorised' }, { status: 401 });
		}

		// If no chatId is provided, return all chats for the user
		if (!chatIdParam) {
			const chats = await getChatbotChatsWithFirstMessageByUserId(user.id);
			return json({ chats }, { status: 200 });
		}

		// If chatId is provided, return the specific chat
		const chatId = parseInt(chatIdParam, 10);
		if (isNaN(chatId)) {
			return json({ error: 'Invalid Chat ID' }, { status: 400 });
		}

		const chat = await getChatbotChatById(chatId);
		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		if (chat.userId !== user.id) {
			return json({ error: 'Forbidden: You do not have access to this chat' }, { status: 403 });
		}

		return json({ chat }, { status: 200 });
	} catch (error) {
		console.error('Error retrieving chat:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
