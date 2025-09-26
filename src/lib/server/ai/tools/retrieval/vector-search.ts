import { Tool } from "@langchain/core/tools";
import { COLLECTION_TYPES } from "../../retrieval/collections/config";
import { ChromaCollectionManager, type CollectionIdentifier } from "../../retrieval/collections/manager";

export interface RetrievalToolConfig {
  name: string;
  description: string;
  collections: CollectionIdentifier[];
  manager: ChromaCollectionManager;
  k?: number;
}

export class MultiCollectionRetrievalTool extends Tool {
  name: string;
  description: string;
  private manager: ChromaCollectionManager;
  private collections: CollectionIdentifier[];
  private k: number;

  constructor(config: RetrievalToolConfig) {
    super();
    this.name = config.name;
    this.description = config.description;
    this.manager = config.manager;
    this.collections = config.collections;
    this.k = config.k || 5;
  }

  /**
   * Call the tool with a query string.
   * Searches across multiple collections and aggregates results.
   * 
   * query: The search query string.
   * returns: A formatted string of search results with sources.
   * 
   * Error handling is included to manage issues during the search process.
   */
  async _call(query: string): Promise<string> {
    try {
      const results = await this.manager.queryMultipleCollections(
        this.collections,
        query,
        this.k
      );

      if (!results || results.length === 0) {
        return "No relevant documents found for the given query.";
      }

      // Format results with collection source information
      const formattedResults = results
        .flatMap(r => r.documents.map(doc => ({
          content: doc.pageContent,
          source: r.collection,
          metadata: doc.metadata
        })))
        .filter(doc => doc.content && doc.content.trim().length > 0)
        .slice(0, this.k) 
        .map((doc, i) => {
          const metadataInfo = doc.metadata?.type ? ` (${doc.metadata.type})` : '';
          return `[${i + 1}] Source: ${doc.source}${metadataInfo}\n${doc.content.trim()}`;
        })
        .join('\n\n---\n\n');

      return formattedResults || "No relevant content found in the documents.";
    } catch (error) {
      console.error(`Error in ${this.name}:`, error);
      return `Error retrieving information: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class RetrievalToolFactory {
  private manager: ChromaCollectionManager;

  constructor(manager: ChromaCollectionManager) {
    this.manager = manager;
  }

  /**
   * Create a curriculum retrieval tool for a specific subject
   * This follows the LangGraph pattern of creating retriever tools
   */
  createCurriculumTool(subjectId: number, yearLevel?: number) {
    return new MultiCollectionRetrievalTool({
      name: `retrieve_curriculum_content`,
      description: `Search and return curriculum content, key knowledge, key skills, learning activities, and assessment tasks for subject ${subjectId}${yearLevel ? ` at year level ${yearLevel}` : ''}. Use this when you need information about what students should learn.`,
      collections: [
        { type: 'curriculum_contents', subjectId, yearLevel },
        { type: 'learning_activities', subjectId, yearLevel },
        { type: 'assessment_tasks', subjectId, yearLevel }
      ],
      manager: this.manager,
      k: 8
    });
  }

  /**
   * Create an exam questions retrieval tool
   */
  createExamTool(subjectId: number, yearLevel?: number) {
    return new MultiCollectionRetrievalTool({
      name: `retrieve_exam_questions`,
      description: `Search and return past exam questions, sample answers, and detailed examples for subject ${subjectId}${yearLevel ? ` at year level ${yearLevel}` : ''}. Use this when you need practice questions or examples for assessment.`,
      collections: [
        { type: 'exam_questions', subjectId, yearLevel },
        { type: 'detailed_examples', subjectId, yearLevel }
      ],
      manager: this.manager,
      k: 5
    });
  }

  /**
   * Create a misconceptions and hints retrieval tool
   */
  createMisconceptionsTool(subjectId?: number, yearLevel?: number) {
    return new MultiCollectionRetrievalTool({
      name: 'retrieve_misconceptions_hints',
      description: `Search and return common student misconceptions, helpful hints, and feedback strategies${subjectId ? ` for subject ${subjectId}` : ''}${yearLevel ? ` at year level ${yearLevel}` : ''}. Use this when you need to understand common student errors or provide targeted support.`,
      collections: [
        { type: 'misconceptions', subjectId, yearLevel },
        { type: 'hints_feedback', subjectId, yearLevel }
      ],
      manager: this.manager,
      k: 5
    });
  }

  /**
   * Create extra content retrieval tool
   */
  createExtraContentTool(subjectId: number, yearLevel?: number) {
    return new MultiCollectionRetrievalTool({
      name: `retrieve_extra_content`,
      description: `Search and return additional learning resources, supplementary materials, and extended content for subject ${subjectId}${yearLevel ? ` at year level ${yearLevel}` : ''}. Use this when you need enrichment materials or additional context.`,
      collections: [
        { type: 'extra_contents', subjectId, yearLevel }
      ],
      manager: this.manager,
      k: 5
    });
  }

  /**
   * Create a comprehensive retrieval tool across all external collections
   * This is useful for agents that need broad access to educational content
   */
  createComprehensiveTool(subjectId: number, yearLevel?: number) {
    const externalCollections = Object.values(COLLECTION_TYPES)
      .filter(c => c.category === 'external')
      .map(c => ({ type: c.name, subjectId, yearLevel }));

    return new MultiCollectionRetrievalTool({
      name: `retrieve_all_content`,
      description: `Comprehensive search across all educational content including curriculum, activities, assessments, exam questions, examples, and extra materials for subject ${subjectId}${yearLevel ? ` at year level ${yearLevel}` : ''}. Use this for broad educational content searches.`,
      collections: externalCollections,
      manager: this.manager,
      k: 15
    });
  }

  /**
   * Create multiple tools for an agent - following LangGraph patterns
   * Returns an array of tools that can be used with ToolNode
   */
  createToolsForSubject(subjectId: number, yearLevel?: number) {
    return [
      this.createCurriculumTool(subjectId, yearLevel),
      this.createExamTool(subjectId, yearLevel),
      this.createMisconceptionsTool(subjectId, yearLevel),
      this.createExtraContentTool(subjectId, yearLevel)
    ];
  }

  /**
   * Create a single unified retrieval tool that can handle different query types
   * This is more flexible and follows the LangGraph single-tool pattern
   */
  createUnifiedRetrievalTool(subjectId: number, yearLevel?: number) {
    // Include all collections for maximum flexibility
    const allCollections = Object.values(COLLECTION_TYPES)
      .map(c => ({ type: c.name, subjectId, yearLevel }));

    return new MultiCollectionRetrievalTool({
      name: `retrieve_educational_content`,
      description: `Search and return relevant educational content from curriculum materials, exam questions, learning activities, assessments, misconceptions, hints, and supplementary resources for subject ${subjectId}${yearLevel ? ` at year level ${yearLevel}` : ''}. This tool can find information across all educational content types to answer student questions, provide examples, identify misconceptions, and support learning.`,
      collections: allCollections,
      manager: this.manager,
      k: 10
    });
  }
}