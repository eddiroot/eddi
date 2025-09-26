export interface CollectionConfig {
  name: string;
  description: string;
  category: 'internal' | 'external';
  metadata?: Record<string, unknown>;
}

export const COLLECTION_TYPES: Record<string, CollectionConfig> = {
  // Internal Data Collections
  questions: {
    name: 'questions',
    description: 'Student questions from modules',
    category: 'internal'
  },
  hints_feedback: {
    name: 'hints_feedback',
    description: 'Hints and feedback with effectiveness metrics',
    category: 'internal'
  },
  misconceptions: {
    name: 'misconceptions',
    description: 'Common misconceptions and corrections',
    category: 'internal'
  },
  eddi_exam: {
    name: 'eddi_exam',
    description: 'EDDI examination data',
    category: 'internal'
  },
  // External Data Collections
  curriculum_contents: {
    name: 'curriculum_contents',
    description: 'Core curriculum content including key knowledge and skills',
    category: 'external'
  },
  learning_activities: {
    name: 'learning_activities',
    description: 'Learning activities by subject and area',
    category: 'external'
  },
  assessment_tasks: {
    name: 'assessment_tasks',
    description: 'Assessment tasks and rubrics',
    category: 'external'
  },
  exam_questions: {
    name: 'exam_questions',
    description: 'Past exam questions with answers',
    category: 'external'
  },
  detailed_examples: {
    name: 'detailed_examples',
    description: 'Detailed worked examples',
    category: 'external'
  },
  extra_contents: {
    name: 'extra_contents',
    description: 'Additional learning resources',
    category: 'external'
  }
};