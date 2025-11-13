import { taskBlockTypeEnum } from "$lib/enums";
import {
    blockAudioFromDocument,
    blockAudioSchema,
    blockAudioToDocument,
    blockBalancingEquationsFromDocument,
    blockBalancingEquationsSchema,
    blockBalancingEquationsToDocument,
    blockChoiceFromDocument,
    blockChoiceSchema,
    blockChoiceToDocument,
    blockCloseFromDocument,
    blockCloseSchema,
    blockCloseToDocument,
    blockFillBlankFromDocument,
    blockFillBlankSchema,
    blockFillBlankToDocument,
    blockGraphFromDocument,
    blockGraphSchema,
    blockGraphToDocument,
    blockHeadingFromDocument,
    blockHeadingSchema,
    blockHeadingToDocument,
    blockHighlightTextFromDocument,
    blockHighlightTextSchema,
    blockHighlightTextToDocument,
    blockImageFromDocument,
    blockImageSchema,
    blockImageToDocument,
    blockMatchingFromDocument,
    blockMatchingSchema,
    blockMatchingToDocument,
    blockMathInputFromDocument,
    blockMathInputSchema,
    blockMathInputToDocument,
    blockRichTextFromDocument,
    blockRichTextSchema,
    blockRichTextToDocument,
    blockShortAnswerFromDocument,
    blockShortAnswerSchema,
    blockShortAnswerToDocument,
    blockTableFromDocument,
    blockTableSchema,
    blockTableToDocument,
    blockVideoFromDocument,
    blockVideoSchema,
    blockVideoToDocument,
    blockWhiteboardFromDocument,
    blockWhiteboardSchema,
    blockWhiteboardToDocument
} from "$lib/server/ai/schemas/taskblock";
import { taskBlock, type TaskBlock } from "$lib/server/db/schema/task";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "./base";

export class TaskBlockVectorStore extends TableVectorStore<TaskBlock> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      toDocument: taskBlockToDocument,
      fromDocument: documentToTaskBlock
    });
  }
}

export const taskBlockToDocument = (record: TaskBlock): Document => {
  const config = record.config;
  let doc: Document;

  switch (record.type) {
    case taskBlockTypeEnum.heading: {
      const parsed = blockHeadingSchema.shape.config.parse(config);
      doc = blockHeadingToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.richText: {
      const parsed = blockRichTextSchema.shape.config.parse(config);
      doc = blockRichTextToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.mathInput: {
      const parsed = blockMathInputSchema.shape.config.parse(config);
      doc = blockMathInputToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.choice: {
      const parsed = blockChoiceSchema.shape.config.parse(config);
      doc = blockChoiceToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.fillBlank: {
      const parsed = blockFillBlankSchema.shape.config.parse(config);
      doc = blockFillBlankToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.matching: {
      const parsed = blockMatchingSchema.shape.config.parse(config);
      doc = blockMatchingToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.shortAnswer: {
      const parsed = blockShortAnswerSchema.shape.config.parse(config);
      doc = blockShortAnswerToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.close: {
      const parsed = blockCloseSchema.shape.config.parse(config);
      doc = blockCloseToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.highlightText: {
      const parsed = blockHighlightTextSchema.shape.config.parse(config);
      doc = blockHighlightTextToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.table: {
      const parsed = blockTableSchema.shape.config.parse(config);
      doc = blockTableToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.whiteboard: {
      const parsed = blockWhiteboardSchema.shape.config.parse(config);
      doc = blockWhiteboardToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.graph: {
      const parsed = blockGraphSchema.shape.config.parse(config);
      doc = blockGraphToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.balancingEquations: {
      const parsed = blockBalancingEquationsSchema.shape.config.parse(config);
      doc = blockBalancingEquationsToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.image: {
      const parsed = blockImageSchema.shape.config.parse(config);
      doc = blockImageToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.video: {
      const parsed = blockVideoSchema.shape.config.parse(config);
      doc = blockVideoToDocument(parsed);
      break;
    }

    case taskBlockTypeEnum.audio: {
      const parsed = blockAudioSchema.shape.config.parse(config);
      doc = blockAudioToDocument(parsed);
      break;
    }

    default: {
      doc = new Document({
        pageContent: JSON.stringify(config)
      });
    }
  }

  doc.metadata = {
    ...doc.metadata,
    id: record.id,
    taskId: record.taskId,
    type: record.type,
    index: record.index,
    availableMarks: record.availableMarks,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    embeddingMetadata: record.embeddingMetadata
  };

  return doc;
};

export const documentToTaskBlock = (doc: Document): Partial<TaskBlock> => {
  const type = doc.metadata.type as taskBlockTypeEnum;
  let config: Record<string, unknown>;

  switch (type) {
    case taskBlockTypeEnum.heading:
      config = blockHeadingFromDocument(doc);
      break;

    case taskBlockTypeEnum.richText:
      config = blockRichTextFromDocument(doc);
      break;

    case taskBlockTypeEnum.mathInput:
      config = blockMathInputFromDocument(doc);
      break;

    case taskBlockTypeEnum.choice:
      config = blockChoiceFromDocument(doc);
      break;

    case taskBlockTypeEnum.fillBlank:
      config = blockFillBlankFromDocument(doc);
      break;

    case taskBlockTypeEnum.matching:
      config = blockMatchingFromDocument(doc);
      break;

    case taskBlockTypeEnum.shortAnswer:
      config = blockShortAnswerFromDocument(doc);
      break;

    case taskBlockTypeEnum.close:
      config = blockCloseFromDocument(doc);
      break;

    case taskBlockTypeEnum.highlightText:
      config = blockHighlightTextFromDocument(doc);
      break;

    case taskBlockTypeEnum.table:
      config = blockTableFromDocument(doc);
      break;

    case taskBlockTypeEnum.whiteboard:
      config = blockWhiteboardFromDocument(doc);
      break;

    case taskBlockTypeEnum.graph:
      config = blockGraphFromDocument(doc);
      break;

    case taskBlockTypeEnum.balancingEquations:
      config = blockBalancingEquationsFromDocument(doc);
      break;

    case taskBlockTypeEnum.image:
      config = blockImageFromDocument(doc);
      break;

    case taskBlockTypeEnum.video:
      config = blockVideoFromDocument(doc);
      break;

    case taskBlockTypeEnum.audio:
      config = blockAudioFromDocument(doc);
      break;

    default:
      config = {};
  }

  return {
    taskId: doc.metadata.taskId as number,
    type,
    config,
    index: doc.metadata.index as number,
    availableMarks: doc.metadata.availableMarks as number | undefined
  };
};