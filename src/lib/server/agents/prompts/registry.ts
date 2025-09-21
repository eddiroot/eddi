import * as blockSchemas from '../../../schemas/blockSchema';
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  template: string;
  variables: PromptVariable[];
  examples?: PromptExample[];
  constraints?: string[];
  responseSchema?: any; // JSON schema for Gemini make a type 
  chainable?: boolean; // Can be chained with other prompts
  tags?: string[]; // For retrieval
}

export enum PromptCategory {
  MODULE_SCAFFOLD = 'module_scaffold',
  CONTENT_GENERATION = 'content_generation',
  INTERACTIVE_GENERATION = 'interactive_generation',
  HINT_GENERATION = 'hint_generation',
  EVALUATION = 'evaluation',
  FEEDBACK = 'feedback',
  QUESTION_SELECTION = 'question_selection'
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface PromptExample {
  input: Record<string, any>;
  output: string;
  explanation?: string;
}

export class PromptRegistry {
  private static prompts = new Map<string, PromptTemplate>();
  private static promptsByCategory = new Map<PromptCategory, Set<string>>();
  private static promptChains = new Map<string, string[]>();

  static {
    this.initializePrompts();
  }

  private static initializePrompts() {
    // Module Generation Prompts
    this.registerPrompt({
      id: 'module_scaffold_generator',
      name: 'Module Scaffold Generator',
      category: PromptCategory.MODULE_SCAFFOLD,
      template: `
Design a VCE learning module structure for:

CONTEXT:
Title: {title}
Description: {description}

Create 3-4 progressive sections that:
1. Build from foundational to advanced concepts
2. Each section should be 12-15 minutes of focused learning
3. Balance conceptual understanding with skill application

For each section provide:
   - Clear learning objective (what will be achieved by the end)
  - 3-4 specific concepts to cover
  - 2-3 practical skills to develop

CONSTRAINTS:
Ensure sections logically build on each other and cover the complete topic.
`,
      variables: [
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'string', required: true },
      ],
      responseSchema: {
        type: 'object',
        properties: {
          overallObjective: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                objective: { type: 'string' },
                concepts: { type: 'array', items: { type: 'string' } },
                skills: { type: 'array', items: { type: 'string' } },
              }
            }
          }
        }
      },
      chainable: true,
      tags: ['module', 'scaffold', 'structure']
    });

    this.registerPrompt({
      id: 'interactive_block_generator',
      name: 'Interactive Block Generator with Testing Effect',
      category: PromptCategory.INTERACTIVE_GENERATION,
      template: `
Generate interactive learning components optimized for retention through testing.

SECTION CONTEXT:
{sectionContent}

CURRICULUM ALIGNMENT:
{curriculumContext}

COMMON MISCONCEPTIONS (for targeted practice):
{commonMisconceptions}

TASK:
Create {numberOfBlocks} interactive blocks that:

1. Test understanding immediately after learning (testing effect)
2. Include progressive hints that scaffold learning
3. Provide detailed feedback for incorrect responses
4. Address common misconceptions

For each block include:
- Clear success criteria aligned to curriculum
- 3 levels of hints (conceptual → procedural → specific)
- Step-by-step solution
- Explanation of why incorrect options are wrong

BLOCK TYPES TO USE:
{availableBlockTypes}

DIFFICULTY PROGRESSION:
Start with recognition → comprehension → application → analysis
`,
      variables: [
        { name: 'sectionContent', type: 'string', required: true },
        { name: 'curriculumContext', type: 'string', required: true },
        { name: 'commonMisconceptions', type: 'array', required: false },
        { name: 'numberOfBlocks', type: 'number', required: true },
        { name: 'availableBlockTypes', type: 'array', required: true }
      ],
      tags: ['interactive', 'testing', 'practice']
    });
    this.registerPrompt({
      id: 'adaptive_hint_provider',
      name: 'Adaptive Hint Provider',
      category: PromptCategory.HINT_GENERATION,
      template: `
Provide a scaffolded hint based on the student's current attempt.

QUESTION:
{question}

STUDENT'S ANSWER:
{studentAnswer}

CORRECT ANSWER:
{correctAnswer}

ATTEMPT NUMBER: {attemptNumber}
PREVIOUS HINTS GIVEN: {previousHints}

HINT LEVEL GUIDE:
- Level 1 (Attempt 1): Conceptual nudge - redirect attention
- Level 2 (Attempt 2): Strategic hint - suggest approach
- Level 3 (Attempt 3): Procedural guidance - break down steps

Generate a hint that:
1. Doesn't give away the answer
2. Builds on previous hints
3. Addresses the specific error pattern
4. Encourages metacognition

If student shows frustration (3+ attempts), provide encouragement and smaller steps.
`,
      variables: [
        { name: 'question', type: 'string', required: true },
        { name: 'studentAnswer', type: 'string', required: false },
        { name: 'correctAnswer', type: 'string', required: true },
        { name: 'attemptNumber', type: 'number', required: true },
        { name: 'previousHints', type: 'array', required: false }
      ],
      tags: ['hint', 'scaffold', 'adaptive']
    });
    /**
     * Mainly for when there is no previous hint
     */
    this.registerPrompt({
      id: 'response_evaluator',
      name: 'Response Evaluator with Feedback',
      category: PromptCategory.EVALUATION,
      template: `
Evaluate the student's response and provide constructive feedback.

TASK BLOCK:
Type: {blockType}
Question: {question}
Criteria: {criteria}

STUDENT RESPONSE:
{studentResponse}

MODEL ANSWER:
{modelAnswer}

RUBRIC:
{rubric}

EVALUATION REQUIREMENTS:
1. Score against each criterion
2. Identify strengths in the response
3. Pinpoint specific misconceptions
4. Suggest targeted improvements
5. Determine mastery level

Consider partial credit for:
- Correct approach with calculation errors
- Partial understanding
- Related but incomplete concepts

FEEDBACK TONE:
- Encouraging and constructive
- Specific and actionable
- Growth-minded
`,
      variables: [
        { name: 'blockType', type: 'string', required: true },
        { name: 'question', type: 'string', required: true },
        { name: 'criteria', type: 'array', required: false },
        { name: 'studentResponse', type: 'object', required: true },
        { name: 'modelAnswer', type: 'object', required: false },
        { name: 'rubric', type: 'object', required: false }
      ],
      responseSchema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          maxScore: { type: 'number' },
          criteriaScores: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                criterion: { type: 'string' },
                score: { type: 'number' },
                maxScore: { type: 'number' },
                feedback: { type: 'string' }
              }
            }
          },
          strengths: { type: 'array', items: { type: 'string' } },
          misconceptions: { type: 'array', items: { type: 'string' } },
          improvements: { type: 'array', items: { type: 'string' } },
          masteryLevel: { type: 'string', enum: ['not_started', 'developing', 'proficient', 'advanced'] }
        }
      },
      tags: ['evaluation', 'feedback', 'assessment']
    });

    this.registerPrompt({
      id: 'content_generator',
      name: 'Learning Content Generator',
      category: PromptCategory.CONTENT_GENERATION,
      template: `
Generate comprehensive learning content for: {title}

Learning Objective: {objective}
Concepts to Cover: {concepts}
Skills to Develop: {skills}

Create engaging explanatory content that:
1. Builds on prerequisites
2. Uses clear examples
3. Includes visual descriptions where helpful
4. Prepares for immediate self-testing

The content should be structured as educational blocks that guide learners through 
the concepts progressively and provide clear explanations with relevant examples.
`,
      variables: [
        { name: 'title', type: 'string', required: true },
        { name: 'objective', type: 'string', required: true },
        { name: 'concepts', type: 'array', required: true },
        { name: 'skills', type: 'array', required: true }
      ],
      responseSchema: {
        type: 'object',
        properties: {
          blocks: {
            type: 'array',
            items: {
              anyOf: [
                blockSchemas.blockHeading,
                blockSchemas.blockRichText
              ]
            }
          }
        }
      },
      chainable: true,
      tags: ['content', 'generation', 'learning']
    });

    this.registerPrompt({
      id: 'adaptive_question_selector',
      name: 'Adaptive Question Selector',
      category: PromptCategory.QUESTION_SELECTION,
      template: `
Select the next question based on student performance.

STUDENT PERFORMANCE:
Recent Responses: {recentResponses}
Current Difficulty: {currentDifficulty}
Struggling Concepts: {strugglingConcepts}
Mastered Concepts: {masteredConcepts}
Time in Session: {sessionTime}

AVAILABLE QUESTIONS:
{availableQuestions}

SELECTION CRITERIA:
1. If student succeeded → increase difficulty or introduce new concept
2. If student struggled → provide similar difficulty with different context
3. If multiple failures → step back to prerequisite concepts
4. Mix review questions (spaced repetition) with new material

Consider:
- Cognitive load (avoid overwhelming)
- Interleaving different concepts
- Building confidence with occasional easier questions
- Testing effect: prioritize retrieval over repetition

Return the question ID that best matches the student's current needs.
`,
      variables: [
        { name: 'recentResponses', type: 'array', required: true },
        { name: 'currentDifficulty', type: 'string', required: true },
        { name: 'strugglingConcepts', type: 'array', required: true },
        { name: 'masteredConcepts', type: 'array', required: true },
        { name: 'sessionTime', type: 'number', required: true },
        { name: 'availableQuestions', type: 'array', required: true }
      ],
      tags: ['adaptive', 'selection', 'personalization']
    });
  }

  static registerPrompt(prompt: PromptTemplate): void {
    this.prompts.set(prompt.id, prompt);
    
    if (!this.promptsByCategory.has(prompt.category)) {
      this.promptsByCategory.set(prompt.category, new Set());
    }
    this.promptsByCategory.get(prompt.category)!.add(prompt.id);
  }

  static getPrompt(id: string): PromptTemplate | undefined {
    return this.prompts.get(id);
  }

  static getPromptsByCategory(category: PromptCategory): PromptTemplate[] {
    const ids = this.promptsByCategory.get(category) || new Set();
    return Array.from(ids).map(id => this.prompts.get(id)!).filter(Boolean);
  }

  static fillPrompt(
    promptId: string,
    variables: Record<string, any>,
    ragContext?: any
  ): string {
    const prompt = this.getPrompt(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    let filled = prompt.template;

    // Add RAG context if provided
    if (ragContext) {
      filled = `
RETRIEVED CONTEXT:
${JSON.stringify(ragContext, null, 2)}

${filled}`;
    }

    // Fill variables
    for (const variable of prompt.variables) {
      const value = variables[variable.name] ?? variable.defaultValue;
      if (variable.required && value === undefined) {
        throw new Error(`Required variable ${variable.name} not provided`);
      }
      
      const formattedValue = typeof value === 'object' 
        ? JSON.stringify(value, null, 2)
        : String(value);
      
      filled = filled.replace(
        new RegExp(`{${variable.name}}`, 'g'),
        formattedValue
      );
    }

    return filled;
  }

  static createPromptChain(
    promptIds: string[],
    variables: Record<string, any>[]
  ): string[] {
    return promptIds.map((id, index) => 
      this.fillPrompt(id, variables[index] || {})
    );
  }
}