/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseAgent, type AgentContext, type AgentResponse, AgentType } from '../index';
import { PromptRegistry } from '../prompts/registry';
import { EducationalVectorStore } from '../retrieval/vector-store';
import { geminiCompletion } from '$lib/server/ai';
import * as blockSchemas from '../../../schemas/blockSchema';
import { getInteractiveSchema } from '../../../schemas/blockSchema';

export class TeachModuleGeneratorAgent extends BaseAgent {
  private vectorStore: EducationalVectorStore;

  constructor() {
    super({
      type: AgentType.TEACH_MODULE_GENERATOR,
      systemInstruction: `You are an expert VCE curriculum designer who creates engaging, 
research-based learning modules that leverage the testing effect and spaced repetition 
for optimal learning outcomes.`,
      temperature: 0.7,
      maxTokens: 5000
    });
    
    this.vectorStore = new EducationalVectorStore();
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    const { action, moduleParams } = context.metadata;

    switch (action) {
      case 'generate_scaffold':
        return await this.generateScaffold(moduleParams);
      case 'generate_content':
        return await this.generateContent(moduleParams);
      case 'generate_interactive':
        return await this.generateInteractive(moduleParams);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async generateScaffold(params: any): Promise<AgentResponse> {
    // Initialize vector store for the subject
    if (params.subjectId) {
      await this.vectorStore.initialize(params.subjectId);
    }

    // Retrieve relevant curriculum context
    const curriculumContext = await this.vectorStore.hybridSearch(
      `${params.title} ${params.description}`,
      {
        collections: ['curriculum_contents'],
        subjectId: params.subjectId,
        k: 10
      }
    );

    // Get the prompt template
    const promptTemplate = PromptRegistry.getPrompt('module_scaffold_generator')!;
    
    // Fill the prompt with context
    const prompt = PromptRegistry.fillPrompt(
      'module_scaffold_generator',
      {
        title: params.title,
        description: params.description,
      },
      curriculumContext
    );

    // Generate with Gemini
    const response = await geminiCompletion(
      prompt,
      undefined, // no media file
      promptTemplate.responseSchema,
      this.getSystemInstruction()
    );

    const scaffold = JSON.parse(response);

    return {
      content: JSON.stringify(scaffold),
      metadata: {
        stage: 'scaffold',
        sectionsGenerated: scaffold.sections.length
      },
      sources: curriculumContext
    };
  }

  private async generateContent(params: any): Promise<AgentResponse> {
    const { section, subjectId } = params;

    // Initialize vector store for the subject
    if (subjectId) {
      await this.vectorStore.initialize(subjectId);
    }

    // Get relevant examples and content
    const examples = await this.vectorStore.hybridSearch(
      section.concepts.join(' '),
      {
        collections: ['detailed_examples', 'curriculum_contents', 'learning_activities'],
        subjectId: subjectId,
        k: 6
      }
    );

    // Get the prompt template
    const promptTemplate = PromptRegistry.getPrompt('content_generator')!;
    
    // Fill the prompt with context
    const prompt = PromptRegistry.fillPrompt(
      'content_generator',
      {
        title: section.title,
        objective: section.objective,
        concepts: section.concepts,
        skills: section.skills
      },
      examples
    );

    const response = await geminiCompletion(
      prompt,
      undefined, // no media file
      promptTemplate.responseSchema,
      this.getSystemInstruction()
    );

    return {
      content: response,
      metadata: {
        stage: 'content',
        blocksGenerated: JSON.parse(response).blocks.length
      },
      sources: examples
    };
  }

  private async generateInteractive(params: any): Promise<AgentResponse> {
    const { section, sectionContent, subjectType, subjectId } = params;

    // Initialize vector store for the subject
    if (subjectId) {
      await this.vectorStore.initialize(subjectId);
    }

    // Find similar exam questions
    const similarQuestions = await this.vectorStore.hybridSearch(
      section.concepts.join(' '),
      {
        collections: ['exam_questions', 'assessment_tasks'],
        subjectId: subjectId,
        k: 5
      }
    );

    // Get common misconceptions to target
    const misconceptions = await this.vectorStore.findCommonMisconceptions(
      section.concepts.join(' '),
      undefined,
      3
    );

    // Select appropriate block types based on subject
    const blockTypes = blockSchemas.getBlockTypesForSubject(subjectType);

    const prompt = PromptRegistry.fillPrompt(
      'interactive_block_generator',
      {
        sectionContent: sectionContent,
        curriculumContext: section,
        commonMisconceptions: misconceptions.map((m: any) => m.content),
        numberOfBlocks: 4,
        availableBlockTypes: blockTypes
      },
      similarQuestions
    );

    // Get appropriate schemas for the subject
    const responseSchema = getInteractiveSchema(subjectType);

    const response = await geminiCompletion(
      prompt,
      undefined, // no media file
      responseSchema,
      this.getSystemInstruction()
    );

    const blocks = JSON.parse(response);

    return {
      content: response,
      metadata: {
        stage: 'interactive',
        blocksGenerated: blocks.interactiveBlocks.length,
        blockTypes: blocks.interactiveBlocks.map((b: any) => b.taskBlock.type)
      },
      sources: [...similarQuestions, ...misconceptions]
    };
  }


}