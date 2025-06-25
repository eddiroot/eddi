import { GEMINI_API_KEY } from '$env/static/private';
import { GoogleGenAI } from '@google/genai';
import { chatbotPrompt } from '$lib/server/chatbot/constants';
import { json, type RequestEvent } from '@sveltejs/kit';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

export interface ChatRequest {
	message: string;
	conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
	response: string;
	messageId: string;
	timestamp: Date;
}

/**
 * Send a message to the chatbot and get a response
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
	try {
		// Build conversation context
		const conversationContext = buildConversationContext(request.conversationHistory || []);
		
		// Create the prompt with context
		const fullPrompt = `${conversationContext}\n\nUser: ${request.message}`;
		
		const response = await ai.models.generateContent({
			model: "gemini-2.0-flash-exp",
			contents: fullPrompt,
			config: {
				systemInstruction: chatbotPrompt,
				temperature: 0.7,
				maxOutputTokens: 1000
			}
		});

		const messageId = generateMessageId();
		const responseText = response.text || 'I apologize, but I couldn\'t generate a response. Please try again.';
		
		return {
			response: responseText,
			messageId,
			timestamp: new Date()
		};
	} catch (error) {
		console.error('Error in sendChatMessage:', error);
		throw new Error('Failed to get response from AI tutor');
	}
}

/**
 * Handle chat requests from the frontend
 */
export async function handleChatRequest(event: RequestEvent) {
	try {
		const { message, conversationHistory }: ChatRequest = await event.request.json();
		
		if (!message || typeof message !== 'string') {
			return json({ error: 'Message is required' }, { status: 400 });
		}

		const response = await sendChatMessage({ message, conversationHistory });
		
		return json(response);
	} catch (error) {
		console.error('Error handling chat request:', error);
		return json(
			{ error: 'Internal server error' }, 
			{ status: 500 }
		);
	}
}

/**
 * Build conversation context from message history
 */
function buildConversationContext(history: ChatMessage[]): string {
	if (history.length === 0) return '';
	
	// Take last 10 messages to keep context manageable
	const recentHistory = history.slice(-10);
	
	return recentHistory
		.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
		.join('\n');
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
	return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate and sanitize user input
 */
export function sanitizeMessage(message: string): string {
	return message.trim().slice(0, 2000); // Limit to 2000 characters
}

/**
 * Check if the message is appropriate for academic context
 */
export function isValidAcademicMessage(message: string): boolean {
	const sanitized = sanitizeMessage(message);
	
	// Basic validation - not empty and reasonable length
	if (!sanitized || sanitized.length < 1) {
		return false;
	}
	
	// Add more validation logic as needed
	return true;
}