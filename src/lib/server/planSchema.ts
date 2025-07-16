export const planSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Title of the generated lesson plan'
    },
    description: {
      type: 'string',
      description: 'A narrative overview of what the lesson will cover'
    },
    scopes: {
      type: 'array',
      description: 'An ordered breakdown of lesson sections',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Heading or focus for this section'
          },
          details: {
            type: 'string',
            description: 'Short description of activities or content in this section'
          }
        },
        required: ['title', 'details']
      }
    },
    usedStandards: {
      type: 'array',
      description: 'The 1-2 learning-area standards leveraged in this plan',
      maxItems: 2,
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          elaborations: {
            type: 'array',
            description: 'Which elaborations of the standard are addressed',
            items: { type: 'string' }
          }
        },
        required: ['id', 'name', 'elaborations']
      }
    }
  },
  required: ['name', 'description', 'scopes', 'usedStandards']

}

/**
 * Build a prompt for Gemini to generate a lesson plan conforming to planSchema.
 *
 * @param contextsJson - JSON-stringified array of PlanContext objects.
 * @returns A prompt string ready to send to Gemini.
 */
export function buildLessonPlanPrompt(
  contextsJson: string
): string {
  return `
You are given:

1) A CourseMapItem description (string).
2) A list of candidate LearningAreaStandard objects:
   • id
   • name
   • description
3) A list of StandardElaboration objects:
   • id
   • learningAreaStandardId
   • name
   • standardElaboration

These contexts are the curriculum framework—use them as guidance to craft a creative, engaging lesson plan.

Structure your output according to the following JSON-Schema as a blueprint (do not add extra properties):

\`\`\`json
${JSON.stringify(planSchema, null, 2)}
\`\`\`

Requirements:
- Treat the provided data as curriculum guidance, not rigid content; you may be creative.
- Pick at most **2** standards from the provided list.
- For each chosen standard, include its elaborations (the \`standardElaboration\` text).
- Produce an ordered array of \`scopes\` (2-6 items), each with:
    - \`title\`: section heading
    - \`details\`: section activities/content
- Provide a high-level \`description\` of the lesson.
- Use a concise \`name\` for the lesson plan title.
- **Do not** exceed the schema's properties or introduce any additional keys.
- **Only** return the JSON object—no explanatory text.

Here is your input data (PlanContext array):
\`\`\`json
${contextsJson}
\`\`\`

Respond now with just the JSON object.
  `.trim();
}
