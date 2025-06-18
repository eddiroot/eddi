import {GoogleGenAI} from '@google/genai';
import fs from 'fs';
import path from 'path';

if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

// lesson schema
const lessonComponentSchema = {
  type: "OBJECT",
  properties: {
    lesson: {
      type: "ARRAY",
      items: {
        anyOf: [
          // Title component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["title"] },
              content: {
                type: "OBJECT",
                properties: {
                  text: { type: "STRING" }
                },
                required: ["text"]
              }
            },
            required: ["type", "content"]
          },
          
          // Subtitle component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["subtitle"] },
              content: {
                type: "OBJECT",
                properties: {
                  text: { type: "STRING" }
                },
                required: ["text"]
              }
            },
            required: ["type", "content"]
          },
          
          // Header components (h1, h2, h3)
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["h1", "h2", "h3"] },
              content: {
                type: "OBJECT",
                properties: {
                  text: { type: "STRING" }
                },
                required: ["text"]
              }
            },
            required: ["type", "content"]
          },
          
          // Paragraph component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["paragraph"] },
              content: {
                type: "OBJECT",
                properties: {
                  markdown: { type: "STRING" }
                },
                required: ["markdown"]
              }
            },
            required: ["type", "content"]
          },
          
          // Math input component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["math_input"] },
              content: {
                type: "OBJECT",
                properties: {
                  question: { type: "STRING" },
                  answer_latex: { type: "STRING" }
                },
                required: ["question", "answer_latex"]
              }
            },
            required: ["type", "content"]
          },
          
          // Text/Number input component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["input"] },
              content: {
                type: "OBJECT",
                properties: {
                  question: { type: "STRING" },
                  input_type: { type: "STRING", enum: ["text", "number"] },
                  unit: { type: "STRING", nullable: true }
                },
                required: ["question", "input_type"]
              }
            },
            required: ["type", "content"]
          },
          
          // Multiple choice component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["multiple_choice"] },
              content: {
                type: "OBJECT",
                properties: {
                  question: { type: "STRING" },
                  options: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  },
                  answer: {
                    oneOf: [
                      { type: "STRING" },
                      {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      }
                    ]
                  },
                  multiple: { type: "BOOLEAN" }
                },
                required: ["question", "options", "answer", "multiple"]
              }
            },
            required: ["type", "content"]
          },
          
          // Video component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["video"] },
              content: {
                type: "OBJECT",
                properties: {
                  url: { type: "STRING" },
                  caption: { type: "STRING" }
                },
                required: ["url", "caption"]
              }
            },
            required: ["type", "content"]
          },
          
          // Image component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["image"] },
              content: {
                type: "OBJECT",
                properties: {
                  url: { type: "STRING" },
                  caption: { type: "STRING" }
                },
                required: ["url", "caption"]
              }
            },
            required: ["type", "content"]
          },
          
          // Fill in the blank component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["fill_in_blank"] },
              content: {
                type: "OBJECT",
                properties: {
                  sentence: { type: "STRING" },
                  answer: { type: "STRING" }
                },
                required: ["sentence", "answer"]
              }
            },
            required: ["type", "content"]
          },
          
          // Matching component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["matching"] },
              content: {
                type: "OBJECT",
                properties: {
                  instructions: { type: "STRING" },
                  pairs: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        left: { type: "STRING" },
                        right: { type: "STRING" }
                      },
                      required: ["left", "right"]
                    }
                  }
                },
                required: ["instructions", "pairs"]
              }
            },
            required: ["type", "content"]
          },
          
          // Drag and drop component
          {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["drag_and_drop"] },
              content: {
                type: "OBJECT",
                properties: {
                  instructions: { type: "STRING" },
                  categories: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        name: { type: "STRING" },
                        items: {
                          type: "ARRAY",
                          items: { type: "STRING" }
                        }
                      },
                      required: ["name", "items"]
                    }
                  },
                  options: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  }
                },
                required: ["instructions", "categories", "options"]
              }
            },
            required: ["type", "content"]
          }
        ]
      }
    }
  },
  required: ["lesson"]
};


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
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonComponentSchema,
      },
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

// Tester function for media sending
export async function testSendMediaToGemini() {
  try {
    const mediaPath = '/Users/blakematheson/Desktop/eddi/eddi/docs/samples/somatosensory.pdf'; // Replace with the path to your media file
    const prompt = `Analyze the attached document/image and create an educational lesson.

                    Using the provided schema, create a comprehensive lesson with:
                        1. A title and subtitle
                        2. 3-5 main sections with appropriate headers (h1, h2, h3)
                        3. Explanatory content using paragraphs
                        4. Try to use the interactive elements provided in the schema including:
                            - Multiple choice questions (both single and multiple answer)
                            - Math input questions (if applicable)
                            - Fill in the blank questions
                            - Text input questions for open-ended responses
                            - Matching or drag-and-drop activities
                    Each component should be structured according to the provided schema.`;
    const result = await sendMediaToGemini(mediaPath, prompt);
    console.log('Test result:', result);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// In-file testing setup
(async () => {
  try {
    console.log('Starting media test...');
    const testResult = await testSendMediaToGemini();
    console.log('Media test completed successfully:', testResult);
  } catch (error) {
    console.error('Media test failed:', error);
  }
})();

