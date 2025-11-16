import { defaultEmbeddings } from '$lib/server/ai/embeddings';
import { AssessmentTaskVectorStore } from '$lib/server/ai/vectorStores/curriculum/assessmentTask';
import { CurriculumSubjectExtraContentVectorStore } from '$lib/server/ai/vectorStores/curriculum/curriculumSubjectExtraContent';
import { ExamQuestionVectorStore } from '$lib/server/ai/vectorStores/curriculum/examQuestion';
import { KeyKnowledgeVectorStore } from '$lib/server/ai/vectorStores/curriculum/keyKnowledge';
import { KeySkillVectorStore } from '$lib/server/ai/vectorStores/curriculum/keySkill';
import { LearningActivityVectorStore } from '$lib/server/ai/vectorStores/curriculum/learningActivity';
import { LearningAreaVectorStore } from '$lib/server/ai/vectorStores/curriculum/learningArea';
import { LearningAreaContentVectorStore } from '$lib/server/ai/vectorStores/curriculum/learningAreaContent';
import { LearningAreaStandardVectorStore } from '$lib/server/ai/vectorStores/curriculum/learningAreaStandard';
import { OutcomeVectorStore } from '$lib/server/ai/vectorStores/curriculum/outcome';
import { StandardElaborationVectorStore } from '$lib/server/ai/vectorStores/curriculum/standardElaboration';
import { db } from '$lib/server/db';
import {
    assessmentTask,
    curriculumSubjectExtraContent,
    examQuestion,
    keyKnowledge,
    keySkill,
    learningActivity,
    learningArea,
    learningAreaContent,
    learningAreaStandard,
    outcome,
    standardElaboration
} from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

interface EmbeddingStats {
  tableName: string;
  total: number;
  processed: number;
  failed: number;
  errors: Array<{ id: number; error: string }>;
}

/**
 * Generate embeddings for a specific table using its vector store
 * Processes records in parallel batches for maximum speed
 */
async function generateEmbeddingsForTable(
  tableName: string,
  table: typeof learningArea | typeof learningAreaContent | typeof learningAreaStandard | typeof standardElaboration | typeof outcome | typeof keySkill | typeof keyKnowledge | typeof examQuestion | typeof learningActivity | typeof assessmentTask | typeof curriculumSubjectExtraContent,
  vectorStore: LearningAreaVectorStore | LearningAreaContentVectorStore | LearningAreaStandardVectorStore | StandardElaborationVectorStore | OutcomeVectorStore | KeySkillVectorStore | KeyKnowledgeVectorStore | ExamQuestionVectorStore | LearningActivityVectorStore | AssessmentTaskVectorStore | CurriculumSubjectExtraContentVectorStore
): Promise<EmbeddingStats> {
  const stats: EmbeddingStats = {
    tableName,
    total: 0,
    processed: 0,
    failed: 0,
    errors: []
  };

  const BATCH_SIZE = 20; // Process more records in parallel
  const MAX_ERRORS_TO_STORE = 20;

  try {
    // Fetch all records that don't have embeddings yet - only select IDs to reduce memory
    const records = await db
      .select({ id: table.id })
      .from(table)
      .where(isNull(table.embedding));

    stats.total = records.length;

    if (stats.total === 0) {
      return stats;
    }

    console.log(`📋 ${tableName}: Found ${stats.total} records to process (batches of ${BATCH_SIZE})`);

    // Process records in batches
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(records.length / BATCH_SIZE);
      
      console.log(`⚙️  ${tableName}: Batch ${batchNum}/${totalBatches} (${batch.length} records)...`);

      // Process batch in parallel using Promise.allSettled
      const results = await Promise.allSettled(
        batch.map(record => vectorStore.updateEmbedding(record.id))
      );

      // Count successes and failures
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          stats.processed++;
        } else {
          stats.failed++;
          const recordId = batch[idx].id;
          const errorMessage = result.reason instanceof Error 
            ? result.reason.message 
            : String(result.reason);
          
          // Only store first N errors
          if (stats.errors.length < MAX_ERRORS_TO_STORE) {
            stats.errors.push({ id: recordId, error: errorMessage });
          }
          
          // Only log first few errors
          if (stats.failed <= 3) {
            console.error(`❌ ${tableName} record ${recordId} failed: ${errorMessage.substring(0, 100)}`);
          }
        }
      });

      // Progress update every batch
      const progress = ((i + batch.length) / records.length * 100).toFixed(1);
      console.log(`   ${progress}% complete (${stats.processed}/${stats.total} processed, ${stats.failed} failed)`);
    }

    console.log(`✅ ${tableName}: Complete - ${stats.processed}/${stats.total} processed, ${stats.failed} failed`);
    return stats;
  } catch (error) {
    console.error(`💥 ${tableName}: Fatal error:`, error);
    throw error;
  }
}

/**
 * POST /api/embeddings/generate
 * Generate embeddings for all curriculum tables
 */
export const POST: RequestHandler = async () => {
  try {
    console.log('🚀 Starting curriculum embedding generation via API...');
    
    const startTime = Date.now();
    const allStats: EmbeddingStats[] = [];

    // Define all tables to process with their vector stores
    const tables = [
      { 
        name: 'Learning Areas', 
        table: learningArea, 
        store: new LearningAreaVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Learning Area Content', 
        table: learningAreaContent, 
        store: new LearningAreaContentVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Learning Area Standards', 
        table: learningAreaStandard, 
        store: new LearningAreaStandardVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Standard Elaborations', 
        table: standardElaboration, 
        store: new StandardElaborationVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Outcomes', 
        table: outcome, 
        store: new OutcomeVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Key Skills', 
        table: keySkill, 
        store: new KeySkillVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Key Knowledge', 
        table: keyKnowledge, 
        store: new KeyKnowledgeVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Exam Questions', 
        table: examQuestion, 
        store: new ExamQuestionVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Learning Activities', 
        table: learningActivity, 
        store: new LearningActivityVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Assessment Tasks', 
        table: assessmentTask, 
        store: new AssessmentTaskVectorStore(defaultEmbeddings) 
      },
      { 
        name: 'Extra Content', 
        table: curriculumSubjectExtraContent, 
        store: new CurriculumSubjectExtraContentVectorStore(defaultEmbeddings) 
      }
    ];

    // Process each table
    for (const { name, table, store } of tables) {
      try {
        console.log(`\n📊 Starting ${name}...`);
        const stats = await generateEmbeddingsForTable(name, table, store);
        allStats.push(stats);
        
        // Log summary after each table
        if (stats.failed > 0) {
          console.log(`⚠️  ${name}: ${stats.processed} succeeded, ${stats.failed} failed`);
        }
      } catch (error) {
        console.error(`❌ Fatal error processing ${name}:`, error);
        allStats.push({
          tableName: name,
          total: 0,
          processed: 0,
          failed: 0,
          errors: [{ id: -1, error: String(error) }]
        });
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const totalRecords = allStats.reduce((sum, s) => sum + s.total, 0);
    const totalProcessed = allStats.reduce((sum, s) => sum + s.processed, 0);
    const totalFailed = allStats.reduce((sum, s) => sum + s.failed, 0);

    console.log(`✅ Embedding generation complete: ${totalProcessed}/${totalRecords} in ${duration}s`);

    return json({
      success: true,
      summary: {
        totalRecords,
        processed: totalProcessed,
        failed: totalFailed,
        duration: parseFloat(duration),
        averagePerSecond: parseFloat((totalProcessed / (parseFloat(duration) || 1)).toFixed(2))
      },
      tables: allStats
    });

  } catch (error) {
    console.error('Fatal error during embedding generation:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
