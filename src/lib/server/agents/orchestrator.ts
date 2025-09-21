import { TeachModuleGeneratorAgent } from './core/teach-me-generator';
// import { LearningTutorAgent } from './core/learning-tutor';
import { AgentType } from './index';
import type { AgentContext, AgentResponse, BaseAgent } from './index';

export class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent> = new Map();

  constructor() {
    // Initialize all agents
    this.agents.set(AgentType.TEACH_MODULE_GENERATOR, new TeachModuleGeneratorAgent());
    // this.agents.set(AgentType.LEARNING_TUTOR, new LearningTutorAgent());
  }

  async executeAgent(
    agentType: AgentType,
    context: AgentContext
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent type ${agentType} not found`);
    }

    // Log for monitoring
    console.log(`Executing agent: ${agentType}`, {
      userId: context.userId,
      sessionId: context.sessionId,
      action: context.metadata?.action
    });

    const startTime = Date.now();
    
    try {
      const response = await agent.execute(context);
      
      // Log success
      console.log(`Agent ${agentType} completed in ${Date.now() - startTime}ms`);
      
      return response;
    } catch (error) {
      // Log error
      console.error(`Agent ${agentType} failed:`, error);
      throw error;
    }
  }

  async executeChain(
    agentTypes: AgentType[],
    initialContext: AgentContext
  ): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];
    let context = initialContext;

    for (const agentType of agentTypes) {
      const response = await this.executeAgent(agentType, context);
      responses.push(response);
      
      // Pass response as context to next agent
      context = {
        ...context,
        metadata: {
          ...context.metadata,
          previousResponse: response
        }
      };
    }

    return responses;
  }
}