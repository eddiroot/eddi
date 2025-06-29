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
				responseSchema,
				systemInstruction
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
