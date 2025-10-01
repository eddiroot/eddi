import { subjectGroupEnum, taskBlockTypeEnum, yearLevelEnum } from '$lib/enums';
import { z } from 'zod';


// ==============================================================================
//                                  Output Schemas
// ==============================================================================

/**
 * Block Schemas
 */

export const blockHeadingSchema = z.object({
    type: z.literal(taskBlockTypeEnum.heading),
    config: z.object({
        text: z.string(),
        size: z.number()
    })
});

export const blockRichTextSchema = z.object({
    type: z.literal(taskBlockTypeEnum.richText),
    config: z.object({
        html: z.string()
    })
});

export const blockMathInputSchema = z.object({
    type: z.literal(taskBlockTypeEnum.mathInput),
    config: z.object({
        question: z.string(),
        answer: z.string()
    }),
});

export const blockChoiceSchema = z.object({
    type: z.literal(taskBlockTypeEnum.choice),
    config: z.object({
        question: z.string(),
        options: z.array(z.object({
            text: z.string(),
            isAnswer: z.boolean()
        })).describe('Array of objects containing the choices and whether that choice is an answer. To make only a single answer valid, the array should contain only one item with isAnswer as true.')
    })
});

export const blockFillBlankSchema = z.object({
    type: z.literal(taskBlockTypeEnum.fillBlank),
    config: z.object({
        sentence: z.string(),
        answers: z.array(z.string())
    })
});

export const blockMatchingSchema = z.object({
    type: z.literal(taskBlockTypeEnum.matching),
    config: z.object({
        instructions: z.string(),
        pairs: z.array(z.object({
            left: z.string(),
            right: z.string()
        }))
    })
});

export const blockShortAnswerSchema = z.object({
    type: z.literal(taskBlockTypeEnum.shortAnswer),
    config: z.object({
        question: z.string()
    })
});

export const blockCloseSchema = z.object({
    type: z.literal(taskBlockTypeEnum.close),
    config: z.object({
        text: z.string()
    })
});

export const blockHighlightTextSchema = z.object({
    type: z.literal(taskBlockTypeEnum.highlightText),
    config: z.object({
        text: z.string(),
        instructions: z.string(),
        highlightCorrect: z.boolean()
    })
});

export const blockTableSchema = z.object({
    type: z.literal(taskBlockTypeEnum.table),
    config: z.object({
        title: z.string(),
        rows: z.number(),
        columns: z.number(),
        data: z.array(z.array(z.string()))
    })
});

export const blockWhiteboardSchema = z.object({
    type: z.literal(taskBlockTypeEnum.whiteboard),
    config: z.object({
        title: z.string(),
        whiteboardId: z.number().nullable()
    })
});

export const blockGraphSchema = z.object({
    type: z.literal(taskBlockTypeEnum.graph),
    config: z.object({
        title: z.string(),
        xAxisLabel: z.string(),
        yAxisLabel: z.string(),
        xRange: z.object({
            min: z.number(),
            max: z.number()
        }),
        yRange: z.object({
            min: z.number(),
            max: z.number()
        }),
        staticPlots: z.array(z.object({
            id: z.string(),
            equation: z.string(),
            color: z.string(),
            label: z.string()
        }))
    })
});

export const blockBalancingEquationsSchema = z.object({
    type: z.literal(taskBlockTypeEnum.balancingEquations),
    config: z.object({
        question: z.string().optional(),
        reactants: z.array(z.object({
            formula: z.string(),
            coefficient: z.number(),
            given: z.boolean()
        })),
        products: z.array(z.object({
            formula: z.string(),
            coefficient: z.number(),
            given: z.boolean()
        }))
    })
});

export const blockImageSchema = z.object({
    type: z.literal(taskBlockTypeEnum.image),
    config: z.object({
        path: z.string(),
        altText: z.string()
    })
});

export const blockVideoSchema = z.object({
    type: z.literal(taskBlockTypeEnum.video),
    config: z.object({
        url: z.string(),
        altText: z.string()
    })
});

export const blockAudioSchema = z.object({
    type: z.literal(taskBlockTypeEnum.audio),
    config: z.object({
        path: z.string(),
        altText: z.string()
    })
});

/**
 * Block extension schemas
 */

export const criteriaItemSchema = z.object({
    description: z.string(),
    marks: z.number().describe('Number of marks allocated to this criteria item')
});

export const markSchema = z.object({
    marks: z.number().describe('Number of marks awarded for this task block'),
});

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']).describe('Difficulty level for the task block');

export const hintsSchema = z.array(z.string()).min(3).max(3).describe('Array of exactly 3 progressive hints to help students');

export const stepsSchema = z.array(z.string()).min(1).describe('Array of step-by-step solution breakdown');


/**
 * Union of all task block schemas (without layouts)
 */

export const taskBlockSchema = z.union([
    blockHeadingSchema,
    blockRichTextSchema,
    blockMathInputSchema,
    blockChoiceSchema,
    blockFillBlankSchema,
    blockMatchingSchema,
    blockShortAnswerSchema,
    blockCloseSchema,
    blockHighlightTextSchema,
    blockTableSchema,
    blockWhiteboardSchema,
    blockGraphSchema,
    blockBalancingEquationsSchema,
    blockImageSchema,
    blockVideoSchema,
    blockAudioSchema,
]);


/**
 * Layout Schema
 */

export const layoutTwoColumnsSchema = z.object({
    type: z.literal('col_2'),
    config: z.object({
        leftColumn: z.array(taskBlockSchema),
        rightColumn: z.array(taskBlockSchema)
    })
});

export const taskLayoutSchemas = [layoutTwoColumnsSchema];

// Combined schema for all task items (components + layouts)
export const taskBlocksAndLayoutsSchema = z.union([
    taskBlockSchema,
    layoutTwoColumnsSchema
]);

/** ==============================================================================
 *                                  Helper Functions
 *
 * Functions to help with block schema management
 * 
 */


/**
 * Get the Zod schema for a specific task block type
 * @param blockType 
 * @returns 
 */
export function getBlockSchema(blockType: taskBlockTypeEnum): z.ZodSchema | undefined {
    return blockTypeToSchemaMap[blockType];
}

/**
 * Mapping block types to their schemas (for easy lookup)
 */
export const blockTypeToSchemaMap: Record<taskBlockTypeEnum, z.ZodSchema> = {
    [taskBlockTypeEnum.heading]: blockHeadingSchema,
    [taskBlockTypeEnum.richText]: blockRichTextSchema,
    [taskBlockTypeEnum.mathInput]: blockMathInputSchema,
    [taskBlockTypeEnum.choice]: blockChoiceSchema,
    [taskBlockTypeEnum.fillBlank]: blockFillBlankSchema,
    [taskBlockTypeEnum.matching]: blockMatchingSchema,
    [taskBlockTypeEnum.shortAnswer]: blockShortAnswerSchema,
    [taskBlockTypeEnum.close]: blockCloseSchema,
    [taskBlockTypeEnum.highlightText]: blockHighlightTextSchema,
    [taskBlockTypeEnum.table]: blockTableSchema,
    [taskBlockTypeEnum.whiteboard]: blockWhiteboardSchema,
    [taskBlockTypeEnum.graph]: blockGraphSchema,
    [taskBlockTypeEnum.balancingEquations]: blockBalancingEquationsSchema,
    [taskBlockTypeEnum.image]: blockImageSchema,
    [taskBlockTypeEnum.video]: blockVideoSchema,
    [taskBlockTypeEnum.audio]: blockAudioSchema
};

/**
 * Get the Zod schemas for all task blocks in a specific subject group
 * @param subjectGroup 
 * @returns 
 */
export function getBlocksForSubjectGroup(subjectGroup: subjectGroupEnum): z.ZodSchema[] {
    switch (subjectGroup) {
        case subjectGroupEnum.maths:
            return [
                blockHeadingSchema,
                blockRichTextSchema,
                blockMathInputSchema,
                blockChoiceSchema,
                blockFillBlankSchema,
                blockGraphSchema
            ];
        case subjectGroupEnum.science:
            return [
                blockHeadingSchema,
                blockRichTextSchema,
                blockChoiceSchema,
                blockFillBlankSchema,
                blockBalancingEquationsSchema,
                blockTableSchema
            ];
        case subjectGroupEnum.english:
            return [
                blockHeadingSchema,
                blockRichTextSchema,
                blockShortAnswerSchema,
                blockCloseSchema,
                blockHighlightTextSchema
            ];
        default:
            return [
                blockHeadingSchema,
                blockRichTextSchema,
                blockChoiceSchema,
                blockShortAnswerSchema,
                blockMatchingSchema,
                blockFillBlankSchema
            ];
    }
}

/**
 * Dynamically extend a block schema with assessment fields
 * @param baseSchema - The base block schema to extend
 * @param fields - Which fields to include
 */
export function extendBlockSchema<T extends z.ZodTypeAny>(
    baseSchema: T, 
    fields: {
        includeMarks?: boolean,
        IncludCriteria?: boolean,
        IncludeDifficulty?: boolean,
        IncludeHints?: boolean,
        IncludeSteps?: boolean
    } = {}
): z.ZodSchema {
    const {
        includeMarks = false,
        IncludCriteria = false,
        IncludeDifficulty = false,
        IncludeHints = false,
        IncludeSteps = false
    } = fields;

    const extensionFields = {}

    if (includeMarks) {
        Object.assign(extensionFields, { marks: markSchema });
    }

    if (IncludCriteria) {
        Object.assign(extensionFields, { criteria: z.array(criteriaItemSchema).min(1) });
    }

    if (IncludeDifficulty) {
        Object.assign(extensionFields, { difficulty: difficultySchema });
    }

    if (IncludeHints) {
        Object.assign(extensionFields, { hints: hintsSchema });
    }

    if (IncludeSteps) {
        Object.assign(extensionFields, { steps: stepsSchema });
    }

    if (Object.keys(extensionFields).length === 0) {
        return baseSchema;
    }

    const parsed = baseSchema._def;
    const shape = parsed.shape();

    const extendConfig = shape.config.extend(extensionFields);

    return z.object({
        type: shape.type,
        config: extendConfig
    });
}


/**  ==============================================================================
 *                                  Input Schemas
 *
 * Input schemas for tools
 * ================================================================================ */

/** 
 * Input Schema for generating a single block
 */

export const generateSingleBlockInputSchema = z.object({
    blockType: z.nativeEnum(taskBlockTypeEnum),
    subjectGroup: z.nativeEnum(subjectGroupEnum),
    yearLevel: z.nativeEnum(yearLevelEnum),
    sectionContent: z.string().describe('The content of the section the block will be part of. This can help provide context for generating the block.'),
    requirements: z.object({
        includeMarks: z.boolean().optional().default(false),
        IncludCriteria: z.boolean().optional().default(false),
        IncludeDifficulty: z.boolean().optional().default(false),
        IncludeHints: z.boolean().optional().default(false),
        IncludeSteps: z.boolean().optional().default(false)
    }).describe('Requirements for the block, such as whether to include marks, criteria, difficulty, hints, and steps.')
});

/**
 * Input Schema for generating multiple blocks
 * 
 */

export const generateMultipleBlocksInputSchema = z.object({
    subjectGroup: z.nativeEnum(subjectGroupEnum),
    yearLevel: z.nativeEnum(yearLevelEnum),
    sectionContent: z.string().describe('The content of the section the blocks will be part of. This can help provide context for generating the blocks.'),
    sectionConcept: z.string().optional().describe('The main concept or topic of the section, to help guide block generation.'),
}).describe('Input schema for generating multiple task blocks for a section.');


