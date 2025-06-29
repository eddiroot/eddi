import { geminiCompletion } from '$lib/server/ai';
import { json, type RequestHandler } from '@sveltejs/kit';
import { systemInstructionChatbot } from '../constants.js';
import {
	createChatbotMessage,
	getChatbotChatById,
	getLatestChatbotMessageByChatId
} from '$lib/server/db/service';

// This endpoint handles creating a new message in a chat.
export const POST: RequestHandler = async (event) => {
	try {
		const { message, chatId } = await event.request.json();

		if (!message || typeof message !== 'string') {
			return json({ error: 'Message is required' }, { status: 400 });
		}

		if (!chatId || typeof chatId !== 'number') {
			return json({ error: 'Chat ID is required' }, { status: 400 });
		}

		const user = event.locals.security.getUser();
		if (!user) {
			return json({ error: 'Unauthorised' }, { status: 401 });
		}

		// Verify the chat exists and user has access
		const chat = await getChatbotChatById(chatId);
		if (!chat) {
			return json({ error: 'Chat not found' }, { status: 404 });
		}

		if (chat.userId !== user.id) {
			return json({ error: 'Forbidden: You do not have access to this chat' }, { status: 403 });
		}

		const createdMessage = await createChatbotMessage(chatId, user.id, message);

		return json({ message: createdMessage }, { status: 201 });
	} catch (error) {
		console.error('Error creating message:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// This endpoint handles generating AI responses for messages.
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

		const latestMessage = await getLatestChatbotMessageByChatId(chatId);

		if (!latestMessage) {
			return json({ error: 'No messages found for this chat' }, { status: 404 });
		}

		const response = await geminiCompletion(
			latestMessage.content,
			undefined,
			undefined,
			systemInstructionChatbot
		);

		const responseText =
			response || "I apologise, but I couldn't generate a response. Please try again.";

		// Create the AI response message
		const aiMessage = await createChatbotMessage(chatId, null, responseText);

		return json({ message: aiMessage }, { status: 200 });
	} catch (error) {
		console.error('Error handling chatbot request:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
