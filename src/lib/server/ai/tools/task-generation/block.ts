import { createTaskBlock } from "$lib/server/db/service/task";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { taskBlockSchema } from "../../schemas/taskblock";


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