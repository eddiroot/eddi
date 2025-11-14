import { taskBlockTypeEnum } from "$lib/enums";
import { classTaskBlockResponse, type ClassTaskBlockResponse } from "$lib/server/db/schema/task";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getClassTaskBlockResponseMetadataByTaskBlockId } from "$lib/server/db/service/task";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import {
  blockBalancingEquationsResponseFromDocument,
  blockBalancingEquationsResponseSchema,
  blockBalancingEquationsResponseToDocument,
  blockChoiceResponseFromDocument,
  blockChoiceResponseSchema,
  blockChoiceResponseToDocument,
  blockCloseResponseFromDocument,
  blockCloseResponseSchema,
  blockCloseResponseToDocument,
  blockFillBlankResponseFromDocument,
  blockFillBlankResponseSchema,
  blockFillBlankResponseToDocument,
  blockGraphResponseFromDocument,
  blockGraphResponseSchema,
  blockGraphResponseToDocument,
  blockHighlightTextResponseFromDocument,
  blockHighlightTextResponseSchema,
  blockHighlightTextResponseToDocument,
  blockMatchingResponseFromDocument,
  blockMatchingResponseSchema,
  blockMatchingResponseToDocument,
  blockMathInputResponseFromDocument,
  blockMathInputResponseSchema,
  blockMathInputResponseToDocument,
  blockShortAnswerResponseFromDocument,
  blockShortAnswerResponseSchema,
  blockShortAnswerResponseToDocument
} from "../../schemas/taskBlock";
import { TableVectorStore } from "../base";

export class TaskBlockResponseVectorStore extends TableVectorStore<ClassTaskBlockResponse> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: classTaskBlockResponse,
      embeddings,
      toDocument: taskBlockResponseToDocument,
      fromDocument: documentToTaskBlockResponse,
      extractMetadata: extractTaskBlockResponseMetadata
    });
  }
}

/**
 * Extract metadata for a ClassTaskBlockResponse by querying related tables
 */
export const extractTaskBlockResponseMetadata = async (
  record: Partial<ClassTaskBlockResponse>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.taskBlockId) {
    return {
      classTaskId: record.classTaskId,
      authorId: record.authorId
    };
  }

  try {
    const metadata = await getClassTaskBlockResponseMetadataByTaskBlockId(record.taskBlockId);
    
    return {
      ...metadata,
      taskBlockId: record.taskBlockId,
      classTaskId: record.classTaskId,
      authorId: record.authorId,
      marks: record.marks
    };
  } catch (error) {
    console.error('Error extracting task block response metadata:', error);
    return {
      taskBlockId: record.taskBlockId,
      classTaskId: record.classTaskId,
      authorId: record.authorId
    };
  }
};

export const taskBlockResponseToDocument = (record: ClassTaskBlockResponse): Document => {
  const response = record.response;
  let doc: Document;

  // Get the block type from metadata or determine from response structure
  const blockType = record.embeddingMetadata?.blockType as taskBlockTypeEnum | undefined;

  if (!blockType || !response) {
    // If no block type or response, create empty document
    doc = new Document({
      pageContent: record.feedback || "No response provided"
    });
  } else {
    switch (blockType) {
      case taskBlockTypeEnum.mathInput: {
        const parsed = blockMathInputResponseSchema.parse(response);
        doc = blockMathInputResponseToDocument(parsed);
        break;
      }

      case taskBlockTypeEnum.choice: {
        const parsed = blockChoiceResponseSchema.parse(response);
        doc = blockChoiceResponseToDocument(parsed);
        break;
      }

      case taskBlockTypeEnum.fillBlank: {
        const parsed = blockFillBlankResponseSchema.parse(response);
        doc = blockFillBlankResponseToDocument(parsed);
        break;
      }

      case taskBlockTypeEnum.matching: {
        const parsed = blockMatchingResponseSchema.parse(response);
        doc = blockMatchingResponseToDocument(parsed);
        break;
      }

      case taskBlockTypeEnum.shortAnswer: {
        const parsed = blockShortAnswerResponseSchema.parse(response);
        doc = blockShortAnswerResponseToDocument(parsed);
        break;
      }

      case taskBlockTypeEnum.close: {
        const parsed = blockCloseResponseSchema.parse(response);
        doc = blockCloseResponseToDocument(parsed);
        break;
      }

      case taskBlockTypeEnum.highlightText: {
        const parsed = blockHighlightTextResponseSchema.parse(response);
        doc = blockHighlightTextResponseToDocument(parsed);
        break;
      }

      case taskBlockTypeEnum.graph: {
        const parsed = blockGraphResponseSchema.parse(response);
        doc = blockGraphResponseToDocument(parsed);
        break;
      }

      case taskBlockTypeEnum.balancingEquations: {
        const parsed = blockBalancingEquationsResponseSchema.parse(response);
        doc = blockBalancingEquationsResponseToDocument(parsed);
        break;
      }

      default: {
        doc = new Document({
          pageContent: JSON.stringify(response)
        });
      }
    }
  }

  // Add feedback to the document content if it exists
  if (record.feedback) {
    doc.pageContent = `${doc.pageContent}\n\nFeedback: ${record.feedback}`;
  }

  doc.metadata = {
    ...doc.metadata,
    id: record.id,
    taskBlockId: record.taskBlockId,
    authorId: record.authorId,
    classTaskId: record.classTaskId,
    marks: record.marks,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    embeddingMetadata: record.embeddingMetadata
  };

  return doc;
};

export const documentToTaskBlockResponse = (doc: Document): Partial<ClassTaskBlockResponse> => {
  const blockType = doc.metadata.embeddingMetadata?.blockType as taskBlockTypeEnum | undefined;
  let response: Record<string, unknown> | null = null;

  if (blockType) {
    // Extract the response part (before feedback if it exists)
    let responseContent = doc.pageContent;
    const feedbackMatch = doc.pageContent.match(/\n\nFeedback:\s*(.+)/s);
    if (feedbackMatch) {
      responseContent = doc.pageContent.substring(0, feedbackMatch.index);
    }

    // Create a temporary document for parsing
    const tempDoc = new Document({ pageContent: responseContent });

    switch (blockType) {
      case taskBlockTypeEnum.mathInput:
        response = blockMathInputResponseFromDocument(tempDoc);
        break;

      case taskBlockTypeEnum.choice:
        response = blockChoiceResponseFromDocument(tempDoc);
        break;

      case taskBlockTypeEnum.fillBlank:
        response = blockFillBlankResponseFromDocument(tempDoc);
        break;

      case taskBlockTypeEnum.matching:
        response = blockMatchingResponseFromDocument(tempDoc);
        break;

      case taskBlockTypeEnum.shortAnswer:
        response = blockShortAnswerResponseFromDocument(tempDoc);
        break;

      case taskBlockTypeEnum.close:
        response = blockCloseResponseFromDocument(tempDoc);
        break;

      case taskBlockTypeEnum.highlightText:
        response = blockHighlightTextResponseFromDocument(tempDoc);
        break;

      case taskBlockTypeEnum.graph:
        response = blockGraphResponseFromDocument(tempDoc);
        break;

      case taskBlockTypeEnum.balancingEquations:
        response = blockBalancingEquationsResponseFromDocument(tempDoc);
        break;

      default:
        response = null;
    }
  }

  // Extract feedback if present
  const feedbackMatch = doc.pageContent.match(/\n\nFeedback:\s*(.+)/s);
  const feedback = feedbackMatch ? feedbackMatch[1].trim() : undefined;

  return {
    taskBlockId: doc.metadata.taskBlockId as number,
    authorId: doc.metadata.authorId as string,
    classTaskId: doc.metadata.classTaskId as number,
    response: response as Record<string, unknown> | undefined,
    feedback,
    marks: doc.metadata.marks as number | undefined
  };
};
