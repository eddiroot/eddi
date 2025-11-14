import { courseMapItemAssessmentPlan, type CourseMapItemAssessmentPlan } from "$lib/server/db/schema";
import { type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { getAssessmentPlanMetadataByCourseMapItemId } from "$lib/server/db/service/coursemap";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class CourseMapItemAssessmentPlanVectorStore extends TableVectorStore<CourseMapItemAssessmentPlan> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: courseMapItemAssessmentPlan,
      embeddings,
      toDocument: courseMapItemAssessmentPlanToDocument,
      fromDocument: documentToCourseMapItemAssessmentPlan,
      extractMetadata: extractAssessmentPlanMetadata
    });
  }
}

export const extractAssessmentPlanMetadata = async (
  record: Partial<CourseMapItemAssessmentPlan>
): Promise<EmbeddingMetadataFilter> => {
  if (!record.courseMapItemId) {
    return {
      name: record.name,
      rubricId: record.rubricId
    };
  }

  try {
    const metadata = await getAssessmentPlanMetadataByCourseMapItemId(record.courseMapItemId);
    
    return {
      ...metadata,
      name: record.name,
      rubricId: record.rubricId
    };
  } catch (error) {
    console.error('Error extracting assessment plan metadata:', error);
    return {
      courseMapItemId: record.courseMapItemId,
      name: record.name,
      rubricId: record.rubricId
    };
  }
};

export const courseMapItemAssessmentPlanToDocument = (record: CourseMapItemAssessmentPlan): Document => {
  const content = `${record.name}\n\n${record.description || ""}\n\nScope: ${record.scope?.join(", ") || "N/A"}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      courseMapItemId: record.courseMapItemId,
      rubricId: record.rubricId,
      name: record.name,
      scope: record.scope,
    }
  });
}

export const documentToCourseMapItemAssessmentPlan = (doc: Document): Partial<CourseMapItemAssessmentPlan> => {
  const metadata = doc.metadata || {};
  const lines = doc.pageContent.split('\n\n');
  const name = lines[0] || '';
  const description = lines[1] || '';
  const scopeMatch = lines[2]?.match(/Scope:\s*(.+)/);
  const scopeStr = scopeMatch ? scopeMatch[1] : '';
  const scope = scopeStr && scopeStr !== 'N/A' ? scopeStr.split(', ').filter(s => s.trim()) : null;
  
  return {
    courseMapItemId: metadata.courseMapItemId as number,
    name,
    scope: scope as string[] | undefined,
    description: description || undefined,
    rubricId: metadata.rubricId as number | undefined,
  };
};