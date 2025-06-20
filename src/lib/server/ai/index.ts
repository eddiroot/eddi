import { GoogleGenAI, type Part } from '@google/genai';
import fs from 'fs';

import { lessonComponentSchema } from '$lib/server/ai/constants';
import { getMimeType } from '$lib/server/ai/utils';

if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function geminiCompletion(
	mediaPath: string | undefined,
	prompt: string
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

		const { text } = await ai.models.generateContent({
			model: 'gemini-2.0-flash',
			contents: [
				{
					role: 'user',
					parts
				}
			],
			config: {
				responseMimeType: 'application/json',
				responseSchema: lessonComponentSchema
			}
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
