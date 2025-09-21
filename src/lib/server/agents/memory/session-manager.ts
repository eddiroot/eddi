import * as moduleService from '$lib/server/db/service/module';
import type { ModuleAgentMemory } from '$lib/server/db/service/module';

// Updated interfaces to match the actual database schema
interface StudentResponse {
  taskBlockId: number;
  isCorrect: boolean;
  evaluation?: string;
  concept?: string; // The concept being tested
  hintsUsed?: number;
}

export class SessionManager {
  private sessions: Map<string, ModuleAgentMemory> = new Map();
  
  async getOrCreateSession(
    userId: string, // Changed to string (UUID)
    moduleId: number,
    sessionType: 'teach' | 'train'
  ): Promise<number> { // Returns session ID as number
    // Get or create session using service
    const session = await moduleService.getOrCreateModuleSession(userId, moduleId, sessionType);

    // Load memory if not already in cache
    if (!this.sessions.has(session.id.toString())) {
      await this.loadSessionMemory(session.id, userId, moduleId);
    }

    // Initialize memory if it was a new session and doesn't have memory yet
    if (!this.sessions.has(session.id.toString())) {
      this.sessions.set(session.id.toString(), {
        recentResponses: [],
        strugglingConcepts: [],
        masteredConcepts: [],
        questionHistory: []
      });
    }

    return session.id;
  }

  async updateSessionMemory(
    sessionId: number,
    response: StudentResponse
  ): Promise<void> {
    const sessionKey = sessionId.toString();
    const memory = this.sessions.get(sessionKey);
    if (!memory) throw new Error('Session not found');

    // For now, we'll store response IDs - this assumes a moduleResponse table will be created
    // or we can store the response data directly in the memory
    const responseId = Date.now(); // Temporary ID until we have proper response storage
    memory.recentResponses.push(responseId);
    if (memory.recentResponses.length > 10) {
      memory.recentResponses.shift();
    }

    // Track question history using the correct structure
    memory.questionHistory.push({
      taskBlockId: response.taskBlockId,
      evaluation: response.evaluation,
      feedBack: response.isCorrect ? 'Correct' : 'Needs improvement'
    });

    // Track struggling concepts
    if (!response.isCorrect && response.concept) {
      const concept = response.concept;
      const existing = memory.strugglingConcepts.find(c => c.concept === concept);
      if (!existing) {
        memory.strugglingConcepts.push({
          concept: concept,
          mistakeCount: 1
        });
      } else {
        existing.mistakeCount++;
      }
    }

    // Move to mastered if consistent success
    if (response.isCorrect && response.concept) {
      // Check recent history for this concept (simplified for now)
      const conceptResponses = memory.questionHistory
        .filter(h => h.taskBlockId === response.taskBlockId)
        .slice(-3);
      
      // If we have enough successful attempts, mark as mastered
      if (conceptResponses.length >= 3) {
        const existingMastered = memory.masteredConcepts.find(c => c.concept === response.concept);
        if (!existingMastered) {
          memory.masteredConcepts.push({
            concept: response.concept,
            confidenceLevel: 'high'
          });
          
          // Remove from struggling concepts
          memory.strugglingConcepts = memory.strugglingConcepts
            .filter(c => c.concept !== response.concept);
        }
      }
    }

    // Persist to database
    await this.persistMemory(sessionId);
  }

  async getSessionMemory(sessionId: number): Promise<ModuleAgentMemory | undefined> {
    return this.sessions.get(sessionId.toString());
  }

  async completeSession(sessionId: number): Promise<void> {
    // Mark session as complete using service
    await moduleService.completeModuleSession(sessionId);
    
    // Remove from memory
    this.sessions.delete(sessionId.toString());
  }

  private async loadSessionMemory(sessionId: number, userId: string, moduleId: number): Promise<void> {
    const sessionKey = sessionId.toString();

    // Load session data from database using service
    const session = await moduleService.getModuleSessionById(sessionId);

    if (!session) throw new Error('Session not found');

    // Parse existing memory or create new
    let memory: ModuleAgentMemory;
    if (session.agentMemory) {
      memory = session.agentMemory as ModuleAgentMemory;
    } else {
      // Load struggling and mastered concepts from database
      const strugglingConcepts = await this.identifyStrugglingConcepts(userId, moduleId);
      const masteredConcepts = await this.identifyMasteredConcepts(userId, moduleId);

      memory = {
        recentResponses: [],
        strugglingConcepts,
        masteredConcepts,
        questionHistory: []
      };
    }

    this.sessions.set(sessionKey, memory);
  }

  private async persistMemory(sessionId: number): Promise<void> {
    const memory = this.sessions.get(sessionId.toString());
    if (!memory) return;

    await moduleService.updateSessionMemory(sessionId, memory);
  }

  // Method to identify struggling concepts from database patterns
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async identifyStrugglingConcepts(_userId: string, _moduleId: number): Promise<Array<{
    concept: string;
    mistakeCount: number;
  }>> {
    // For now, return empty array until we have proper response tracking
    // In a full implementation, this would query response data to find:
    // - Concepts with low success rates
    // - Concepts requiring multiple attempts
    // - Concepts where user frequently requests hints
    
    // Example implementation would look like:
    /*
    const moduleSubTasks = await db
      .select({ concepts: table.moduleSubTask.concepts })
      .from(table.moduleSubTask)
      .where(eq(table.moduleSubTask.moduleId, moduleId));

    const strugglingConcepts = await db
      .select({
        concept: moduleResponse.concept,
        mistakeCount: sql<number>`COUNT(CASE WHEN is_correct = false THEN 1 END)`
      })
      .from(moduleResponse)
      .where(
        and(
          eq(moduleResponse.userId, userId),
          eq(moduleResponse.moduleId, moduleId)
        )
      )
      .groupBy(moduleResponse.concept)
      .having(sql`COUNT(CASE WHEN is_correct = false THEN 1 END) >= 2`);
    */

    return [];
  }

  // Method to identify mastered concepts from database patterns  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async identifyMasteredConcepts(_userId: string, _moduleId: number): Promise<Array<{
    concept: string;
    confidenceLevel: 'low' | 'medium' | 'high';
  }>> {
    // For now, return empty array until we have proper response tracking
    // In a full implementation, this would query response data to find:
    // - Concepts with high success rates (>90%)
    // - Concepts answered correctly on first attempt consistently
    // - Concepts where user no longer needs hints

    // Example implementation would look like:
    /*
    const moduleSubTasks = await db
      .select({ concepts: table.moduleSubTask.concepts })
      .from(table.moduleSubTask)
      .where(eq(table.moduleSubTask.moduleId, moduleId));

    const masteredConcepts = await db
      .select({
        concept: moduleResponse.concept,
        successRate: sql<number>`
          CAST(COUNT(CASE WHEN is_correct = true THEN 1 END) AS FLOAT) / 
          COUNT(*) * 100
        `,
        totalAttempts: sql<number>`COUNT(*)`
      })
      .from(moduleResponse)
      .where(
        and(
          eq(moduleResponse.userId, userId),
          eq(moduleResponse.moduleId, moduleId)
        )
      )
      .groupBy(moduleResponse.concept)
      .having(
        and(
          sql`COUNT(*) >= 3`, // At least 3 attempts
          sql`CAST(COUNT(CASE WHEN is_correct = true THEN 1 END) AS FLOAT) / COUNT(*) >= 0.9` // 90%+ success rate
        )
      );

    return masteredConcepts.map(concept => ({
      concept: concept.concept,
      confidenceLevel: concept.successRate >= 95 ? 'high' as const :
                      concept.successRate >= 85 ? 'medium' as const : 'low' as const
    }));
    */

    return [];
  }


}
