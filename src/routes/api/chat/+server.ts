import { handleChatRequest } from '$lib/components/ai-sidebar/ai-sidebar.server';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * POST endpoint for AI chatbot
 * Accepts JSON payload with message and optional conversation history
 * Returns AI response with message ID and timestamp
 */
export const POST: RequestHandler = async (event) => {
	return await handleChatRequest(event);
};
