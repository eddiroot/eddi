import { EducationalVectorStore } from './vector-store.js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import * as curriculumService from '$lib/server/db/service/curriculum';

interface CurriculumDataFile {
  learningActivities?: Array<{
    id?: number;
    activity?: string;
    description?: string;
    unit?: number;
    areaOfStudy?: number;
    outcome?: string | number;
    topic?: string;
  }>;
  
  assessmentTasks?: Array<{
    id?: number;
    title?: string;
    task?: string;
    type?: string;
    description?: string;
    unit?: number | string;
    areaOfStudy?: number;
  }>;
  
  detailedExamples?: Array<{
    id?: number;
    title?: string;
    content?: string;
    example?: string;
    unit?: number;
    areaOfStudy?: number;
  }>;
  
  extraContent?: Array<{
    id?: number;
    content?: string;
    description?: string;
    type?: string;
    unit?: number;
    areaOfStudy?: number;
  }>;
  
  definitions?: Array<{
    id?: number;
    definition?: string;
    content?: string;
    unit?: number;
    areaOfStudy?: number;
  }>;
  
  methods?: Array<{
    id?: number;
    method?: string;
    content?: string;
    description?: string;
    unit?: number;
    areaOfStudy?: number;
  }>;
  
  characteristics?: Array<{
    id?: number;
    characteristic?: string;
    content?: string;
    description?: string;
    unit?: number;
    areaOfStudy?: number;
  }>;
  
  outcomeAssessments?: Array<{
    id?: number;
    criteria?: string;
    description?: string;
    content?: string;
    unit?: number;
    areaOfStudy?: number;
  }>;
}

interface ExamQuestionsFile {
  examQuestions?: Array<{
    id?: number;
    question?: string;
    answer?: string;
    marks?: number;
    year?: number;
    unit?: number;
    areaOfStudy?: number;
  }>;
  questions?: Array<{
    id?: number;
    question?: string;
    answer?: string;
    marks?: number;
    year?: number;
    unit?: number;
    areaOfStudy?: number;
  }>;
}

export class VectorIndexingService {
  private vectorStore: EducationalVectorStore;
  
  constructor() {
    this.vectorStore = new EducationalVectorStore();
  }
  
  async initialize() {
    // Get all subjects first
    const subjects = await curriculumService.getAllCurriculumSubjects();
    const subjectIds = subjects.map(s => s.id);
    
    console.log(`🔧 Initializing vector store for ${subjectIds.length} subjects: ${subjectIds.join(', ')}`);
    
    // Initialize vector store for all subjects at once
    await this.vectorStore.initializeAllSubjects(subjectIds);
  }
  
  /**
   * Main indexing pipeline - indexes everything
   */
  async indexEverything() {
    console.log('🚀 Starting comprehensive curriculum indexing...');
    
    try {
      await this.initialize();
      
      // 1. Index core curriculum from database
      await this.indexAllDatabaseCurriculum();
      
      // 2. Index curriculum data files
      await this.indexAllCurriculumDataFiles();
      
      // 3. Index exam questions
      await this.indexAllExamQuestions();
      
      // 4. Index pseudocode for math subjects
      await this.indexPseudocode();
      
      console.log('✅ Comprehensive indexing completed successfully!');
    } catch (error) {
      console.error('❌ Indexing failed:', error);
      throw error;
    }
  }
  
  /**
   * Index curriculum content from database
   */
  private async indexAllDatabaseCurriculum() {
    console.log('📚 Indexing database curriculum content...');
    
    const subjects = await curriculumService.getAllCurriculumSubjects();
    
    for (const subject of subjects) {
      console.log(`  Processing ${subject.name}...`);
      
      try {
        // Get all curriculum data with relationships
        const { keyKnowledge, keySkills, learningAreas, outcomes } = await curriculumService.getCurriculumDataForSubject(subject.id);
        
        // Debug logging to understand what we're getting
        console.log(`    🔍 Debug for ${subject.name}:`);
        console.log(`      - Key Knowledge: ${keyKnowledge.length} items`);
        console.log(`      - Key Skills: ${keySkills.length} items`);
        console.log(`      - Learning Areas: ${learningAreas.length} items`);
        console.log(`      - Outcomes: ${outcomes.length} items`);
        
        if (keyKnowledge.length > 0) {
          console.log(`      - Sample Key Knowledge: ${keyKnowledge[0].kk.description?.substring(0, 100)}...`);
        }
        if (keySkills.length > 0) {
          console.log(`      - Sample Key Skill: ${keySkills[0].ks.description?.substring(0, 100)}...`);
        }
        
        // Build topics map from outcome descriptions and topic names
        const topicMap = new Map<number, string>();
        outcomes.forEach((outcome) => {
          if (outcome.id) {
            topicMap.set(outcome.id, outcome.description || `Outcome ${outcome.number}`);
          }
        });
        
        // Also add topics from keyKnowledge and keySkills topicName field
        keyKnowledge.forEach(({ kk }) => {
          if (kk.outcomeId && kk.topicName) {
            topicMap.set(kk.outcomeId, kk.topicName);
          }
        });
        
        keySkills.forEach(({ ks }) => {
          if (ks.outcomeId && ks.topicName) {
            topicMap.set(ks.outcomeId, ks.topicName);
          }
        });
        
        // Format and index curriculum content
        const formattedKeyKnowledge = keyKnowledge.map(({ kk }) => ({
          id: kk.id,
          number: kk.number,
          description: kk.description || '',
          outcomeId: kk.outcomeId,
          curriculumSubjectId: kk.curriculumSubjectId,
          topicName: kk.topicName,
          isArchived: kk.isArchived,
          createdAt: kk.createdAt,
          updatedAt: kk.updatedAt
        }));
        
        const formattedKeySkills = keySkills.map(({ ks }) => ({
          id: ks.id,
          number: ks.number,
          description: ks.description || '',
          outcomeId: ks.outcomeId,
          curriculumSubjectId: ks.curriculumSubjectId,
          topicName: ks.topicName,
          isArchived: ks.isArchived,
          createdAt: ks.createdAt,
          updatedAt: ks.updatedAt
        }));
        
        const formattedOutcomes = outcomes.map((outcome) => ({
          id: outcome.id,
          number: outcome.number,
          description: outcome.description || '',
          curriculumSubjectId: outcome.curriculumSubjectId,
          isArchived: outcome.isArchived,
          createdAt: outcome.createdAt,
          updatedAt: outcome.updatedAt
        }));
        
        await this.vectorStore.indexCurriculumContent(
          formattedKeyKnowledge,
          formattedKeySkills,
          learningAreas,
          formattedOutcomes,
          subject.id,
          topicMap
        );
        
        console.log(`    ✅ Indexed ${formattedKeyKnowledge.length} key knowledge, ${formattedKeySkills.length} key skills`);
      } catch (error) {
        console.error(`    ❌ Failed to index ${subject.name}:`, error);
      }
    }
  }
  
  /**
   * Index all curriculum data files
   */
  private async indexAllCurriculumDataFiles() {
    console.log('📄 Indexing curriculum data files...');
    
    const dataPath = join(process.cwd(), 'data');
    const files = readdirSync(dataPath).filter(f => 
      f.endsWith('_curriculum_data.json') && f !== 'pseudocode.json'
    );
    
    for (const file of files) {
      console.log(`  Processing ${file}...`);
      
      try {
        const subjectName = this.extractSubjectNameFromFile(file);
        const subject = await this.findSubjectByName(subjectName);
        
        if (!subject) {
          console.log(`    ⚠️ Subject not found: ${subjectName}`);
          continue;
        }
        
        const filePath = join(dataPath, file);
        const data: CurriculumDataFile = JSON.parse(readFileSync(filePath, 'utf-8'));
        
        // Index learning activities
        if (data.learningActivities?.length) {
          const formattedActivities = data.learningActivities.map(activity => ({
            activity: activity.activity || activity.description || '',
            learningArea: this.formatLearningArea(activity.unit, activity.areaOfStudy)
          }));
          
          await this.vectorStore.indexLearningActivities(formattedActivities, subject.id);
          console.log(`    📝 Indexed ${formattedActivities.length} learning activities`);
        }
        
        // Index assessment tasks
        if (data.assessmentTasks?.length) {
          const formattedTasks = data.assessmentTasks.map(task => ({
            task: task.task || task.type || task.description || '',
            learningArea: this.formatLearningArea(
              typeof task.unit === 'string' ? parseInt(task.unit) : task.unit,
              task.areaOfStudy
            )
          }));
          
          await this.vectorStore.indexAssessmentTasks(formattedTasks, subject.id);
          console.log(`    📋 Indexed ${formattedTasks.length} assessment tasks`);
        }
        
        // Index detailed examples
        if (data.detailedExamples?.length) {
          const formattedExamples = data.detailedExamples.map(example => ({
            title: example.title || 'Example',
            content: example.content || example.example || '',
            learningArea: this.formatLearningArea(example.unit, example.areaOfStudy)
          }));
          
          await this.vectorStore.indexDetailedExample(formattedExamples, subject.id);
          console.log(`    📚 Indexed ${formattedExamples.length} detailed examples`);
        }
        
        // Collect all extra content including outcomeAssessments for math subjects
        const extraContent: Array<{ description: string; contentType: string }> = [];
        
        // Add regular extra content
        if (data.extraContent?.length) {
          extraContent.push(...data.extraContent.map(item => ({
            description: item.content || item.description || '',
            contentType: item.type || 'extra'
          })));
        }
        
        // Add definitions
        if (data.definitions?.length) {
          extraContent.push(...data.definitions.map(item => ({
            description: item.definition || item.content || '',
            contentType: 'definition'
          })));
        }
        
        // Add methods
        if (data.methods?.length) {
          extraContent.push(...data.methods.map(item => ({
            description: item.method || item.content || item.description || '',
            contentType: 'method'
          })));
        }
        
        // Add characteristics
        if (data.characteristics?.length) {
          extraContent.push(...data.characteristics.map(item => ({
            description: item.characteristic || item.content || item.description || '',
            contentType: 'characteristic'
          })));
        }
        
        // Add outcomeAssessments as criteria (for math subjects)
        if (data.outcomeAssessments?.length) {
          extraContent.push(...data.outcomeAssessments.map(item => ({
            description: item.criteria || item.description || item.content || '',
            contentType: 'criteria'
          })));
        }
        
        if (extraContent.length > 0) {
          await this.vectorStore.indexExtraContent(extraContent, subject.id);
          console.log(`    📖 Indexed ${extraContent.length} extra content items`);
        }
        
      } catch (error) {
        console.error(`    ❌ Failed to process ${file}:`, error);
      }
    }
  }
  
  /**
   * Index all exam questions
   */
  private async indexAllExamQuestions() {
    console.log('📝 Indexing exam questions...');
    
    const examPath = join(process.cwd(), 'data', 'exam-qustions');
    
    if (!existsSync(examPath)) {
      console.log('  ⚠️ Exam questions folder not found');
      return;
    }
    
    const examFiles = readdirSync(examPath).filter(f => f.endsWith('.json'));
    
    for (const file of examFiles) {
      console.log(`  Processing ${file}...`);
      
      try {
        const subjectName = this.mapExamFileToSubject(file.replace('.json', ''));
        const subject = await this.findSubjectByName(subjectName);
        
        if (!subject) {
          console.log(`    ⚠️ Subject not found: ${subjectName}`);
          continue;
        }
        
        const filePath = join(examPath, file);
        const data: ExamQuestionsFile = JSON.parse(readFileSync(filePath, 'utf-8'));
        
        const questions = data.examQuestions || data.questions || [];
        
        if (questions.length > 0) {
          const formattedQuestions = questions.map(q => ({
            question: q.question || '',
            answer: q.answer,
            example: q.marks ? `${q.marks} marks` : undefined,
            learningArea: this.formatLearningArea(q.unit, q.areaOfStudy)
          }));
          
          await this.vectorStore.indexExamQuestions(formattedQuestions, subject.id);
          console.log(`    ✅ Indexed ${formattedQuestions.length} exam questions`);
        }
      } catch (error) {
        console.error(`    ❌ Failed to process ${file}:`, error);
      }
    }
  }
  
  /**
   * Index pseudocode for specialist and mathematical methods
   */
  private async indexPseudocode() {
    console.log('🔢 Indexing pseudocode for mathematics subjects...');
    
    const pseudocodePath = join(process.cwd(), 'data', 'pseudocode.json');
    
    if (!existsSync(pseudocodePath)) {
      console.log('  ⚠️ Pseudocode file not found');
      return;
    }
    
    try {
      const data: CurriculumDataFile = JSON.parse(readFileSync(pseudocodePath, 'utf-8'));
      
      // Find both math subjects
      const specialistMath = await this.findSubjectByName('Specialist Mathematics');
      const mathMethods = await this.findSubjectByName('Mathematical Methods');
      
      const mathSubjects = [specialistMath, mathMethods].filter(Boolean) as Array<{ id: number; name: string }>;
      
      if (mathSubjects.length === 0) {
        console.log('  ⚠️ Mathematics subjects not found');
        return;
      }
      
      for (const subject of mathSubjects) {
        console.log(`  Indexing pseudocode for ${subject.name}...`);
        
        // Index learning activities
        if (data.learningActivities?.length) {
          const formattedActivities = data.learningActivities.map(activity => ({
            activity: `Pseudocode: ${activity.activity || activity.description || ''}`,
            learningArea: this.formatLearningArea(activity.unit, activity.areaOfStudy)
          }));
          
          await this.vectorStore.indexLearningActivities(formattedActivities, subject.id);
          console.log(`    📝 Indexed ${formattedActivities.length} pseudocode activities`);
        }
        
        // Index assessment tasks
        if (data.assessmentTasks?.length) {
          const formattedTasks = data.assessmentTasks.map(task => ({
            task: `Pseudocode: ${task.task || task.type || task.description || ''}`,
            learningArea: this.formatLearningArea(
              typeof task.unit === 'string' ? parseInt(task.unit) : task.unit,
              task.areaOfStudy
            )
          }));
          
          await this.vectorStore.indexAssessmentTasks(formattedTasks, subject.id);
          console.log(`    📋 Indexed ${formattedTasks.length} pseudocode tasks`);
        }
      }
    } catch (error) {
      console.error('  ❌ Failed to index pseudocode:', error);
    }
  }
  
  /**
   * Format learning area string as U{unit}AOS{areaOfStudy}
   */
  private formatLearningArea(unit?: number, areaOfStudy?: number): string {
    if (!unit || !areaOfStudy) return '';
    return `U${unit}AOS${areaOfStudy}`;
  }
  
  /**
   * Extract subject name from curriculum data filename
   */
  private extractSubjectNameFromFile(fileName: string): string {
    const nameMap: Record<string, string> = {
      'accounting_curriculum_data.json': 'Accounting',
      'biology_curriculum_data.json': 'Biology',
      'business-management_curriculum_data.json': 'Business Management',
      'chemistry_curriculum_data.json': 'Chemistry',
      'economics_curriculum_data.json': 'Economics',
      'english_curriculum_data.json': 'English',
      'general_mathematics_curriculum_data.json': 'General Mathematics',
      'health_and_human_development_curriculum_data.json': 'Health and Human Development',
      'legal_studies_curriculum_data.json': 'Legal Studies',
      'literature_curriculum_data.json': 'Literature',
      'mathematical_methods_curriculum_data.json': 'Mathematical Methods',
      'pe_curriculum_data.json': 'Physical Education',
      'physics_curriculum_data.json': 'Physics',
      'psychology_curriculum_data.json': 'Psychology',
      'specialist_mathematics_curriculum_data.json': 'Specialist Mathematics'
    };
    
    return nameMap[fileName] || fileName.replace('_curriculum_data.json', '').replace(/_/g, ' ');
  }
  
  /**
   * Map exam file names to subject names
   */
  private mapExamFileToSubject(fileName: string): string {
    const nameMap: Record<string, string> = {
      'chemistry': 'Chemistry',
      'physics': 'Physics',
      'mathematical_mathods': 'Mathematical Methods', // Note: keeping typo from filename
      'general': 'General Mathematics'
    };
    
    return nameMap[fileName] || fileName;
  }
  
  /**
   * Find subject by name in database
   */
  private async findSubjectByName(subjectName: string): Promise<{ id: number; name: string } | null> {
    return await curriculumService.findSubjectByName(subjectName);
  }
  
  /**
   * Get vector store instance
   */
  getVectorStore(): EducationalVectorStore {
    return this.vectorStore;
  }
  
  /**
   * Test indexing by performing sample searches
   */
  async testIndexing(subjectId: number, query: string = 'key concepts') {
    console.log(`🔍 Testing indexing for subject ${subjectId}...`);
    
    const results = await this.vectorStore.hybridSearch(query, {
      subjectId,
      collections: [
        'curriculum_contents',
        'learning_activities',
        'assessment_tasks',
        'exam_questions',
        'detailed_examples',
        'extra_contents'
      ],
      k: 10
    });
    
    console.log(`Found ${results.length} results for "${query}":`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. [${result.source}/${result.metadata.type}] ${result.content.substring(0, 100)}...`);
    });
    
    return results;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const indexer = new VectorIndexingService();
  
  indexer.indexEverything()
    .then(async () => {
      console.log('✅ Indexing completed successfully!');
      
      // Test with a sample subject
      const subjects = await curriculumService.getAllCurriculumSubjects();
      if (subjects.length > 0) {
        await indexer.testIndexing(subjects[0].id);
      }
      
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Indexing failed:', error);
      process.exit(1);
    });
}