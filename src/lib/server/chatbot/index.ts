import { GEMINI_API_KEY } from '$env/static/private';
import { GoogleGenAI } from '@google/genai';
import { chatbotPrompt } from './constants';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function chatBot() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "What is 5 times 10?",
    config: {
      systemInstruction: chatbotPrompt,
    },
  });
  console.log(response.text);
}

