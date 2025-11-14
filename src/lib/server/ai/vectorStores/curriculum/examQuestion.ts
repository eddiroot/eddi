import { yearLevelEnum } from "$lib/enums";
import { examQuestion, type ExamQuestion } from "$lib/server/db/schema";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class ExamQuestionVectorStore extends TableVectorStore<ExamQuestion> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: examQuestion,
      embeddings,
      toDocument: examQuestionToDocument,
      fromDocument: documentToExamQuestion
    });
  }
}

export const examQuestionToDocument = (record: ExamQuestion): Document => {
  const content = `Question (Year Level: ${record.yearLevel}):\n${record.question}\n\nAnswer:\n${record.answer}`;
  return new Document({
    pageContent: content,
    metadata: {
      id: record.id,
      curriculumSubjectId: record.curriculumSubjectId,
      yearLevel: record.yearLevel,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      embeddingMetadata: record.embeddingMetadata
    }
  });
}

export const documentToExamQuestion = (doc: Document): Partial<ExamQuestion> => {
  const metadata = doc.metadata || {};
  
  // Parse the content to extract year level, question, and answer
  const yearLevelMatch = doc.pageContent.match(/Question\s*\(Year Level:\s*(.+?)\):/);
  const yearLevel = yearLevelMatch ? yearLevelMatch[1].trim() : metadata.yearLevel;
  
  const questionMatch = doc.pageContent.match(/Question\s*\(Year Level:\s*.+?\):\s*(.+?)\s*Answer:/s);
  const answerMatch = doc.pageContent.match(/Answer:\s*(.+)/s);
  
  const question = questionMatch ? questionMatch[1].trim() : doc.pageContent;
  const answer = answerMatch ? answerMatch[1].trim() : '';
  
  return {
    curriculumSubjectId: metadata.curriculumSubjectId as number,
    yearLevel: yearLevel as yearLevelEnum,
    question,
    answer
  };
};
