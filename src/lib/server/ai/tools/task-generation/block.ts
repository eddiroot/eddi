import { createTaskBlock } from "$lib/server/db/service/task";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getBaseLLM } from "../../models/llm-models";
import { buildBlockPrompt } from "../../prompts/taskblock";
import { extendBlockSchema, generateSingleBlockInputSchema, getBlockSchema, taskBlockSchema } from "../../schemas/taskblock";


/**
 * Tool for persisting blocks to database
 * Separated from generation for flexibility
 */
export const saveBlocksToDbTool = tool(
  async ({ taskId, blocks }) => {
    const savedIds = [];
    
    try {
      // Validate all blocks first
      const validatedBlocks = blocks.map(block => 
        taskBlockSchema.parse(block)
      );

      // Save in transaction
      for (let i = 0; i < validatedBlocks.length; i++) {
        const block = validatedBlocks[i];
        const saved = await createTaskBlock(
          taskId,
          block.type,
          block.config,
          i
        );
        savedIds.push(saved.id);
      }

      return JSON.stringify({ 
        success: true, 
        savedIds,
        message: `Saved ${savedIds.length} blocks` 
      });
    } catch (error) {
      return JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  },
  {
    name: "save_blocks_to_db",
    description: "Save generated task blocks to the database.",
    schema: z.object({
        taskId: z.number(),
        blocks: z.array(taskBlockSchema)
    })
    }
);

export const generateSingleBlockTool = tool(
    async ({ blockType, content, taskType, requirements }) => {
        
        const model = getBaseLLM({ temperature: 0.7, maxTokens: 1500 });
        
        // Get the schema for the block type
        const schema = getBlockSchema(blockType);
        if (!schema) {
            return JSON.stringify({
                success: false,
                error: `Invalid block type: ${blockType}`
            });
        }
        const schemaWithRequirements = extendBlockSchema(schema, requirements);

        // Create a structured model with the extended schema
        const structuredModel = model.withStructuredOutput(schemaWithRequirements);
        const prompt = buildBlockPrompt(blockType, content, taskType, requirements);

        const block = await structuredModel.invoke(prompt);

        return JSON.stringify(block);
    },
    {
        name: "generate_single_block",
        description: "Generate a single task block with a specific type and content. Returns the generated block schema.",
        schema: generateSingleBlockInputSchema
    }
);
