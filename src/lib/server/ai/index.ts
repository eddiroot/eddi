import { GoogleGenAI, type Part } from '@google/genai';
import fs from 'fs';

import { getMimeType } from '$lib/server/ai/utils';
import { env } from '$env/dynamic/private';
import type { SubjectThread, SubjectThreadResponse } from '$lib/server/db/schema/subjects';

if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
if (!env.GEMINI_DEFAULT_MODEL) throw new Error('GEMINI_DEFAULT_MODEL is not set');
if (!env.GEMINI_DEFAULT_IMAGE_MODEL) throw new Error('GEMINI_DEFAULT_IMAGE_MODEL is not set');

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
			model: env.GEMINI_DEFAULT_MODEL,
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
		const contents = messages.map((msg) => ({
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
			model: env.GEMINI_DEFAULT_MODEL,
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

export async function geminiImageGeneration(prompt: string) {
	try {
		const response = await ai.models.generateContent({
			model: 'gemini-2.0-flash-preview-image-generation',
			contents: [
				{
					role: 'user',
					parts: [{ text: prompt }]
				}
			],
			config: {
				responseModalities: ['TEXT', 'IMAGE']
			}
		});

		// Look for image data in response.candidates[0].content.parts
		for (const part of response?.candidates?.[0]?.content?.parts || []) {
			if (part.inlineData && part.inlineData.data) {
				return part.inlineData.data; // base64-encoded image
			}
		}

		throw new Error('No image generated by Gemini');
	} catch (error) {
		console.error('Error generating image with Gemini:', error);
		throw error;
	}
}

export async function generateThreadSummary(
	threadData: {
		thread: SubjectThread;
		user: {
			firstName: string | null;
			middleName: string | null;
			lastName: string | null;
			avatarUrl: string | null;
		};
	},
	answers: Array<{
		response: SubjectThreadResponse;
		user: {
			firstName: string | null;
			middleName: string | null;
			lastName: string | null;
			avatarUrl: string | null;
		};
	}>,
	comments: Array<{
		response: SubjectThreadResponse;
		user: {
			firstName: string | null;
			middleName: string | null;
			lastName: string | null;
			avatarUrl: string | null;
		};
	}>
): Promise<string> {
	const prompt = `
Please provide a concise summary of this discussion thread:

ORIGINAL POST:
Title: ${threadData.thread.title}
Type: ${threadData.thread.type}
Content: ${threadData.thread.content}
Author: ${threadData.user.firstName} ${threadData.user.lastName}

MAIN ANSWERS:
${answers.map(a => `- ${a.response.content} (by ${a.user.firstName} ${a.user.lastName})`).join('\n')}

MAIN COMMENTS:
${comments.map(c => `- ${c.response.content} (by ${c.user.firstName} ${c.user.lastName})`).join('\n')}

Please summarise the thread, touching on all the key points and ensuring that it is easily understandable for school students.
`;

	const systemInstruction = "You are a helpful assistant that creates concise, well-structured summaries of academic discussions  and Q&A threads for school students who are looking to get all the necessary information. The summaries should be in plain text format (not markdown).";

	return await geminiCompletion(
		prompt,
		undefined,
		undefined,
		systemInstruction
	);
}