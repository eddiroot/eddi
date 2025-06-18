import {GoogleGenAI} from '@google/genai';
import fs from 'fs';
import path from 'path';

if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

// Simple function to send prompt to Gemini
export async function sendPromptToGemini(prompt: string): Promise<string> {
  try {
    console.log("Sending prompt to Gemini:", prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    });
    const text = response.text;

    if (typeof text === 'string') {
      return text;
    } else {
      throw new Error('No text response from Gemini');
    }
  } catch (error) {
    console.error('Error sending prompt to Gemini:', error);
    throw error;
  }
}

// Test function you can import and use anywhere in your server code
export async function testGemini() {
  try {
    const response = await sendPromptToGemini("What is the capital of France?");
    console.log("Test response:", response);
    return response;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}

// Function to send media and prompt to Gemini
export async function sendMediaToGemini(mediaPath: string, prompt: string): Promise<string> {
  try {
    console.log(`Sending media (${mediaPath}) and prompt to Gemini:`, prompt);

    // Read the media file
    const mediaContent = fs.readFileSync(mediaPath);

    // Send the media and prompt to Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: getMimeType(mediaPath),
                data: mediaContent.toString('base64'),
              },
            },
          ],
        },
      ],
    });

    // Helper function to get mime type from file extension
    function getMimeType(filePath: string): string {
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          return 'image/jpeg';
        case '.png':
          return 'image/png';
        case '.pdf':
          return 'application/pdf';
        default:
          return 'application/octet-stream';
      }
    }

    const text = response.text;

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

// In-file testing setup
// Example usage
(async () => {
  try {
    const mediaPath = '/Users/blakematheson/Desktop/eddi/eddi/docs/samples/sample.pdf'; // Replace with the path to your media file
    const prompt = 'Tell me the title of this PDF document.';
    const result = await sendMediaToGemini(mediaPath, prompt);
    console.log('Media response:', result);
  } catch (error) {
    console.error('Error during media test:', error);
  }
})();