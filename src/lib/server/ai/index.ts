import { GoogleGenAI, type Part } from '@google/genai';
import fs from 'fs';

import { getMimeType } from '$lib/server/ai/utils';
import { env } from '$env/dynamic/private';

if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function geminiCompletion(
	prompt: string,
	mediaPath: string | undefined,
	responseSchema: object | undefined,
	systemInstruction: string | undefined = undefined
): Promise<string> {
	try {
		const parts: Part[] = [
			{
				text: prompt
			}
		];

		if (mediaPath) {
			const mediaContent = fs.readFileSync(mediaPath);
			parts.push({
				inlineData: {
					mimeType: getMimeType(mediaPath),
					data: mediaContent.toString('base64')
				}
			});
		}

		const config: {
			systemInstruction?: string;
			responseMimeType?: string;
			responseSchema?: object;
		} = {
			systemInstruction
		};

		// Only use JSON response format when a schema is provided
		if (responseSchema) {
			config.responseMimeType = 'application/json';
			config.responseSchema = responseSchema;
		}

		const { text } = await ai.models.generateContent({
			model: 'gemini-2.0-flash',
			contents: [
				{
					role: 'user',
					parts
				}
			],
			config
		});

		if (typeof text === 'string') {
			return text;
		} else {
			throw new Error('No text response from Gemini');
		}
	} catch (error) {
		console.error('Error sending media to Gemini:', error);
		throw error;
	}
}

export async function geminiConversation(
	messages: Array<{ role: 'user' | 'model'; content: string }>,
	systemInstruction?: string
): Promise<string> {
	try {
		const contents = messages.map(msg => ({
			role: msg.role,
			parts: [{ text: msg.content }]
		}));

		const config: {
			systemInstruction?: string;
		} = {};

		if (systemInstruction) {
			config.systemInstruction = systemInstruction;
		}

		const { text } = await ai.models.generateContent({
			model: 'gemini-2.0-flash',
			contents,
			config
		});

		if (typeof text === 'string') {
			return text;
		} else {
			throw new Error('No text response from Gemini');
		}
	} catch (error) {
		console.error('Error in Gemini conversation:', error);
		throw error;
	}
}
