import { subjectGroupEnum, taskBlockTypeEnum, taskTypeEnum } from '$lib/enums';
import { Document } from '@langchain/core/documents';
import { z } from 'zod';


// =================================================================================
// Schemas and Converters for Task Blocks
// =================================================================================

/**
 * Block: Heading
 */

export const blockHeadingSchema = z.object({
    type: z.literal(taskBlockTypeEnum.heading),
    config: z.object({
        text: z.string(),
        size: z.number()
    })
});

export const blockHeadingToDocument = (config: z.infer<typeof blockHeadingSchema>['config']): Document => {
    return new Document({
        pageContent: `Heading: ${config.text} (Size: ${config.size})`,
    });
}

export const blockHeadingFromDocument = (doc: Document): z.infer<typeof blockHeadingSchema>['config'] => {
    const headingMatch = doc.pageContent.match(/Heading:\s*(.+?)\s*\(Size:\s*(\d+)\)/);
    if (headingMatch) {
        return {
            text: headingMatch[1],
            size: parseInt(headingMatch[2], 10)
        };
    }
    return {
        text: doc.pageContent,
        size: 1
    };
}

/**
 * Block: Rich Text
 */
export const blockRichTextSchema = z.object({
    type: z.literal(taskBlockTypeEnum.richText),
    config: z.object({
        html: z.string()
    })
});

export const blockRichTextToDocument = (config: z.infer<typeof blockRichTextSchema>['config']): Document => {
    return new Document({
        pageContent: config.html,
    });
};

export const blockRichTextFromDocument = (doc: Document): z.infer<typeof blockRichTextSchema>['config'] => {
    return {
        html: doc.pageContent
    };
};

/**
 * Block: Math Input
 */

export const blockMathInputSchema = z.object({
    type: z.literal(taskBlockTypeEnum.mathInput),
    config: z.object({
        question: z.string(),
        answer: z.string()
    }),
});

export const blockMathInputToDocument = (config: z.infer<typeof blockMathInputSchema>['config']): Document => {
    return new Document({
        pageContent: `Question: ${config.question}\nAnswer: ${config.answer}`,
    });
};

export const blockMathInputFromDocument = (doc: Document): z.infer<typeof blockMathInputSchema>['config'] => {
    const questionMatch = doc.pageContent.match(/Question:\s*(.+?)\s*Answer:/s);
    const answerMatch = doc.pageContent.match(/Answer:\s*(.+)/s);
    return {
        question: questionMatch ? questionMatch[1].trim() : doc.pageContent,
        answer: answerMatch ? answerMatch[1].trim() : ''
    };
};

/**
 * Block: Choice
 */

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

export const blockChoiceToDocument = (config: z.infer<typeof blockChoiceSchema>['config']): Document => {
    const optionsText = config.options.map((opt, idx) => `${idx + 1}. ${opt.text} ${opt.isAnswer ? '(Answer)' : ''}`).join('\n');
    return new Document({
        pageContent: `Question: ${config.question}\nOptions:\n${optionsText}`,
    });
};

export const blockChoiceFromDocument = (doc: Document): z.infer<typeof blockChoiceSchema>['config'] => {
    const questionMatch = doc.pageContent.match(/Question:\s*(.+?)\s*Options:/s);
    const optionsMatch = doc.pageContent.match(/Options:\s*([\s\S]+)/s);
    const options: Array<{ text: string; isAnswer: boolean }> = [];

    if (optionsMatch) {
        const optionsLines = optionsMatch[1].trim().split('\n');
        for (const line of optionsLines) {
            const optionMatch = line.match(/^\d+\.\s*(.+?)(\s*\(Answer\))?$/);
            if (optionMatch) {
                options.push({
                    text: optionMatch[1].trim(),
                    isAnswer: !!optionMatch[2]
                });
            }
        }
    }

    return {
        question: questionMatch ? questionMatch[1].trim() : doc.pageContent,
        options
    };
};

/**
 * Block: Fill in the Blank
 */

export const blockFillBlankSchema = z.object({
    type: z.literal(taskBlockTypeEnum.fillBlank),
    config: z.object({
        sentence: z.string(),
        answers: z.array(z.string())
    })
});

export const blockFillBlankToDocument = (config: z.infer<typeof blockFillBlankSchema>['config']): Document => {
    return new Document({
        pageContent: `Sentence: ${config.sentence}\nAnswers: ${config.answers.join(', ')}`,
    });
};

export const blockFillBlankFromDocument = (doc: Document): z.infer<typeof blockFillBlankSchema>['config'] => {
    const sentenceMatch = doc.pageContent.match(/Sentence:\s*(.+?)\s*Answers:/s);
    const answersMatch = doc.pageContent.match(/Answers:\s*(.+)/s);
    return {
        sentence: sentenceMatch ? sentenceMatch[1].trim() : doc.pageContent,
        answers: answersMatch ? answersMatch[1].split(',').map(ans => ans.trim()) : []
    };
};

/**
 * Block: Matching
 */

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

export const blockMatchingToDocument = (config: z.infer<typeof blockMatchingSchema>['config']): Document => {
    const pairsText = config.pairs.map((pair, idx) => `${idx + 1}. ${pair.left}  -  ${pair.right}`).join('\n');
    return new Document({
        pageContent: `Instructions: ${config.instructions}\nPairs:\n${pairsText}`,
    });
};

export const blockMatchingFromDocument = (doc: Document): z.infer<typeof blockMatchingSchema>['config'] => {
    const instructionsMatch = doc.pageContent.match(/Instructions:\s*(.+?)\s*Pairs:/s);
    const pairsMatch = doc.pageContent.match(/Pairs:\s*([\s\S]+)/s);
    const pairs: Array<{ left: string; right: string }> = [];

    if (pairsMatch) {
        const pairsLines = pairsMatch[1].trim().split('\n');
        for (const line of pairsLines) {
            const pairMatch = line.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/);
            if (pairMatch) {
                pairs.push({
                    left: pairMatch[1].trim(),
                    right: pairMatch[2].trim()
                });
            }
        }
    }

    return {
        instructions: instructionsMatch ? instructionsMatch[1].trim() : doc.pageContent,
        pairs
    };
};

/**
 * Block: Short Answer
 */

export const blockShortAnswerSchema = z.object({
    type: z.literal(taskBlockTypeEnum.shortAnswer),
    config: z.object({
        question: z.string()
    })
});

export const blockShortAnswerToDocument = (config: z.infer<typeof blockShortAnswerSchema>['config']): Document => {
    return new Document({
        pageContent: `Question: ${config.question}`,
    });
};

export const blockShortAnswerFromDocument = (doc: Document): z.infer<typeof blockShortAnswerSchema>['config'] => {
    const questionMatch = doc.pageContent.match(/Question:\s*(.+)/s);
    return {
        question: questionMatch ? questionMatch[1].trim() : doc.pageContent
    };
};

export const blockCloseSchema = z.object({
    type: z.literal(taskBlockTypeEnum.close),
    config: z.object({
        text: z.string()
    })
});

export const blockCloseToDocument = (config: z.infer<typeof blockCloseSchema>['config']): Document => {
    return new Document({
        pageContent: `Text: ${config.text}`,
    });
};

export const blockCloseFromDocument = (doc: Document): z.infer<typeof blockCloseSchema>['config'] => {
    const textMatch = doc.pageContent.match(/Text:\s*(.+)/s);
    return {
        text: textMatch ? textMatch[1].trim() : doc.pageContent
    };
};

export const blockHighlightTextSchema = z.object({
    type: z.literal(taskBlockTypeEnum.highlightText),
    config: z.object({
        text: z.string(),
        instructions: z.string(),
        highlightCorrect: z.boolean()
    })
});

export const blockHighlightTextToDocument = (config: z.infer<typeof blockHighlightTextSchema>['config']): Document => {
    return new Document({
        pageContent: `Instructions: ${config.instructions}\nText: ${config.text}\nHighlight Correct: ${config.highlightCorrect}`,
    });
};

export const blockHighlightTextFromDocument = (doc: Document): z.infer<typeof blockHighlightTextSchema>['config'] => {
    const instructionsMatch = doc.pageContent.match(/Instructions:\s*(.+?)\s*Text:/s);
    const textMatch = doc.pageContent.match(/Text:\s*(.+?)\s*Highlight Correct:/s);
    const highlightMatch = doc.pageContent.match(/Highlight Correct:\s*(true|false)/s);
    return {
        instructions: instructionsMatch ? instructionsMatch[1].trim() : doc.pageContent,
        text: textMatch ? textMatch[1].trim() : '',
        highlightCorrect: highlightMatch ? highlightMatch[1].trim() === 'true' : false
    };
};

/**
 * Block: Table
 */

export const blockTableSchema = z.object({
    type: z.literal(taskBlockTypeEnum.table),
    config: z.object({
        title: z.string(),
        rows: z.number(),
        columns: z.number(),
        data: z.array(z.array(z.string()))
    })
});

export const blockTableToDocument = (config: z.infer<typeof blockTableSchema>['config']): Document => {
    const dataText = config.data.map(row => row.join(' | ')).join('\n');
    return new Document({
        pageContent: `Title: ${config.title}\nRows: ${config.rows}\nColumns: ${config.columns}\nData:\n${dataText}`,
    });
};

export const blockTableFromDocument = (doc: Document): z.infer<typeof blockTableSchema>['config'] => {
    const titleMatch = doc.pageContent.match(/Title:\s*(.+?)\s*Rows:/s);
    const rowsMatch = doc.pageContent.match(/Rows:\s*(\d+)\s*Columns:/s);
    const columnsMatch = doc.pageContent.match(/Columns:\s*(\d+)\s*Data:/s);
    const dataMatch = doc.pageContent.match(/Data:\s*([\s\S]+)/s);
    const data: string[][] = [];

    if (dataMatch) {
        const dataLines = dataMatch[1].trim().split('\n');
        for (const line of dataLines) {
            data.push(line.split('|').map(cell => cell.trim()));
        }
    }

    return {
        title: titleMatch ? titleMatch[1].trim() : doc.pageContent,
        rows: rowsMatch ? parseInt(rowsMatch[1], 10) : data.length,
        columns: columnsMatch ? parseInt(columnsMatch[1], 10) : (data[0] ? data[0].length : 0),
        data
    };
};

/**
 * Block: Whiteboard
 */

export const blockWhiteboardSchema = z.object({
    type: z.literal(taskBlockTypeEnum.whiteboard),
    config: z.object({
        title: z.string(),
        whiteboardId: z.number().nullable()
    })
});

export const blockWhiteboardToDocument = (config: z.infer<typeof blockWhiteboardSchema>['config']): Document => {
    return new Document({
        pageContent: `Whiteboard Title: ${config.title}\nWhiteboard ID: ${config.whiteboardId}`,
    });
};

export const blockWhiteboardFromDocument = (doc: Document): z.infer<typeof blockWhiteboardSchema>['config'] => {
    const titleMatch = doc.pageContent.match(/Whiteboard Title:\s*(.+?)\s*Whiteboard ID:/s);
    const idMatch = doc.pageContent.match(/Whiteboard ID:\s*(.+)/s);
    return {
        title: titleMatch ? titleMatch[1].trim() : doc.pageContent,
        whiteboardId: idMatch ? (idMatch[1].trim() === 'null' ? null : parseInt(idMatch[1].trim(), 10)) : null
    };
};

/**
 * Block: Graph
 */

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
export const blockGraphToDocument = (config: z.infer<typeof blockGraphSchema>['config']): Document => {
    const plotsText = config.staticPlots.map(plot => `ID: ${plot.id}, Equation: ${plot.equation}, Color: ${plot.color}, Label: ${plot.label}`).join('\n');
    return new Document({
        pageContent: `Graph Title: ${config.title}\nX-Axis: ${config.xAxisLabel} (${config.xRange.min} to ${config.xRange.max})\nY-Axis: ${config.yAxisLabel} (${config.yRange.min} to ${config.yRange.max})\nStatic Plots:\n${plotsText}`,
    });
};

export const blockGraphFromDocument = (doc: Document): z.infer<typeof blockGraphSchema>['config'] => {
    const titleMatch = doc.pageContent.match(/Graph Title:\s*(.+?)\s*X-Axis:/s);
    const xAxisMatch = doc.pageContent.match(/X-Axis:\s*(.+?)\s*\((.+?) to (.+?)\)/s);
    const yAxisMatch = doc.pageContent.match(/Y-Axis:\s*(.+?)\s*\((.+?) to (.+?)\)/s);
    const plotsMatch = doc.pageContent.match(/Static Plots:\s*([\s\S]+)/s);
    const staticPlots: Array<{ id: string; equation: string; color: string; label: string }> = [];

    if (plotsMatch) {
        const plotsLines = plotsMatch[1].trim().split('\n');
        for (const line of plotsLines) {
            const plotMatch = line.match(/ID:\s*(.+?),\s*Equation:\s*(.+?),\s*Color:\s*(.+?),\s*Label:\s*(.+)/);
            if (plotMatch) {
                staticPlots.push({
                    id: plotMatch[1].trim(),
                    equation: plotMatch[2].trim(),
                    color: plotMatch[3].trim(),
                    label: plotMatch[4].trim()
                });
            }
        }
    }

    return {
        title: titleMatch ? titleMatch[1].trim() : doc.pageContent,
        xAxisLabel: xAxisMatch ? xAxisMatch[1].trim() : '',
        yAxisLabel: yAxisMatch ? yAxisMatch[1].trim() : '',
        xRange: {
            min: xAxisMatch ? parseFloat(xAxisMatch[2].trim()) : 0,
            max: xAxisMatch ? parseFloat(xAxisMatch[3].trim()) : 0
        },
        yRange: {
            min: yAxisMatch ? parseFloat(yAxisMatch[2].trim()) : 0,
            max: yAxisMatch ? parseFloat(yAxisMatch[3].trim()) : 0
        },
        staticPlots
    };
};

/**
 * Block: Balancing Equations
 */

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

export const blockBalancingEquationsToDocument = (config: z.infer<typeof blockBalancingEquationsSchema>['config']): Document => {
    const reactantsText = config.reactants.map(r => `${r.coefficient} ${r.formula} ${r.given ? '(given)' : ''}`).join(' + ');
    const productsText = config.products.map(p => `${p.coefficient} ${p.formula} ${p.given ? '(given)' : ''}`).join(' + ');
    return new Document({
        pageContent: `Question: ${config.question || 'Balance the following equation.'}\nEquation: ${reactantsText} -> ${productsText}`,
    });
};

export const blockBalancingEquationsFromDocument = (doc: Document): z.infer<typeof blockBalancingEquationsSchema>['config'] => {
    const questionMatch = doc.pageContent.match(/Question:\s*(.+?)\s*Equation:/s);
    const equationMatch = doc.pageContent.match(/Equation:\s*(.+)/s);
    const reactants: Array<{ formula: string; coefficient: number; given: boolean }> = [];
    const products: Array<{ formula: string; coefficient: number; given: boolean }> = [];
    if (equationMatch) {
        const [reactantsPart, productsPart] = equationMatch[1].split('->').map(part => part.trim());
        const reactantItems = reactantsPart.split('+').map(item => item.trim());
        for (const item of reactantItems) {
            const match = item.match(/(\d+)\s+(.+?)(\s*\(given\))?$/);
            if (match) {
                reactants.push({
                    coefficient: parseInt(match[1], 10),
                    formula: match[2].trim(),
                    given: !!match[3]
                });
            }
        }
        const productItems = productsPart.split('+').map(item => item.trim());
        for (const item of productItems) {
            const match = item.match(/(\d+)\s+(.+?)(\s*\(given\))?$/);
            if (match) {
                products.push({
                    coefficient: parseInt(match[1], 10),
                    formula: match[2].trim(),
                    given: !!match[3]
                });
            }
        }
    }
    return {
        question: questionMatch ? questionMatch[1].trim() : undefined,
        reactants,
        products
    };
};

/**
 * Block: Image
 */

export const blockImageSchema = z.object({
    type: z.literal(taskBlockTypeEnum.image),
    config: z.object({
        path: z.string(),
        altText: z.string()
    })
});

export const blockImageToDocument = (config: z.infer<typeof blockImageSchema>['config']): Document => {
    return new Document({
        pageContent: `Image Path: ${config.path}\nAlt Text: ${config.altText}`,
    });
};

export const blockImageFromDocument = (doc: Document): z.infer<typeof blockImageSchema>['config'] => {
    const pathMatch = doc.pageContent.match(/Image Path:\s*(.+?)\s*Alt Text:/s);
    const altTextMatch = doc.pageContent.match(/Alt Text:\s*(.+)/s);
    return {
        path: pathMatch ? pathMatch[1].trim() : '',
        altText: altTextMatch ? altTextMatch[1].trim() : ''
    };
};

/** 
 * Block: Video
 */

export const blockVideoSchema = z.object({
    type: z.literal(taskBlockTypeEnum.video),
    config: z.object({
        url: z.string(),
        altText: z.string()
    })
});

export const blockVideoToDocument = (config: z.infer<typeof blockVideoSchema>['config']): Document => {
    return new Document({
        pageContent: `Video URL: ${config.url}\nAlt Text: ${config.altText}`,
    });
};

export const blockVideoFromDocument = (doc: Document): z.infer<typeof blockVideoSchema>['config'] => {
    const urlMatch = doc.pageContent.match(/Video URL:\s*(.+?)\s*Alt Text:/s);
    const altTextMatch = doc.pageContent.match(/Alt Text:\s*(.+)/s);
    return {
        url: urlMatch ? urlMatch[1].trim() : '',
        altText: altTextMatch ? altTextMatch[1].trim() : ''
    };
};

/**
 * Block: Audio
 */

export const blockAudioSchema = z.object({
    type: z.literal(taskBlockTypeEnum.audio),
    config: z.object({
        path: z.string(),
        altText: z.string()
    })
});

export const blockAudioToDocument = (config: z.infer<typeof blockAudioSchema>['config']): Document => {
    return new Document({
        pageContent: `Audio Path: ${config.path}\nAlt Text: ${config.altText}`,
    });
};

export const blockAudioFromDocument = (doc: Document): z.infer<typeof blockAudioSchema>['config'] => {
    const pathMatch = doc.pageContent.match(/Audio Path:\s*(.+?)\s*Alt Text:/s);
    const altTextMatch = doc.pageContent.match(/Alt Text:\s*(.+)/s);
    return {
        path: pathMatch ? pathMatch[1].trim() : '',
        altText: altTextMatch ? altTextMatch[1].trim() : ''
    };
};

// =================================================================================
// Schemas and Converters for Task Block Responses
// =================================================================================

/**
 * Response: Math Input
 */
export const blockMathInputResponseSchema = z.object({
    answer: z.string()
});

export const blockMathInputResponseToDocument = (response: z.infer<typeof blockMathInputResponseSchema>): Document => {
    return new Document({
        pageContent: `Student Answer: ${response.answer}`,
    });
};

export const blockMathInputResponseFromDocument = (doc: Document): z.infer<typeof blockMathInputResponseSchema> => {
    const answerMatch = doc.pageContent.match(/Student Answer:\s*(.+)/s);
    return {
        answer: answerMatch ? answerMatch[1].trim() : ''
    };
};

/**
 * Response: Choice
 */
export const blockChoiceResponseSchema = z.object({
    answers: z.array(z.string())
});

export const blockChoiceResponseToDocument = (response: z.infer<typeof blockChoiceResponseSchema>): Document => {
    return new Document({
        pageContent: `Selected Answers: ${response.answers.join(', ')}`,
    });
};

export const blockChoiceResponseFromDocument = (doc: Document): z.infer<typeof blockChoiceResponseSchema> => {
    const answersMatch = doc.pageContent.match(/Selected Answers:\s*(.+)/s);
    return {
        answers: answersMatch ? answersMatch[1].split(',').map(ans => ans.trim()) : []
    };
};

/**
 * Response: Fill in the Blank
 */
export const blockFillBlankResponseSchema = z.object({
    answers: z.array(z.string())
});

export const blockFillBlankResponseToDocument = (response: z.infer<typeof blockFillBlankResponseSchema>): Document => {
    return new Document({
        pageContent: `Student Answers: ${response.answers.join(', ')}`,
    });
};

export const blockFillBlankResponseFromDocument = (doc: Document): z.infer<typeof blockFillBlankResponseSchema> => {
    const answersMatch = doc.pageContent.match(/Student Answers:\s*(.+)/s);
    return {
        answers: answersMatch ? answersMatch[1].split(',').map(ans => ans.trim()) : []
    };
};

/**
 * Response: Matching
 */
export const blockMatchingResponseSchema = z.object({
    matches: z.array(z.object({
        left: z.string(),
        right: z.string()
    }))
});

export const blockMatchingResponseToDocument = (response: z.infer<typeof blockMatchingResponseSchema>): Document => {
    const matchesText = response.matches.map((match, idx) => `${idx + 1}. ${match.left} -> ${match.right}`).join('\n');
    return new Document({
        pageContent: `Student Matches:\n${matchesText}`,
    });
};

export const blockMatchingResponseFromDocument = (doc: Document): z.infer<typeof blockMatchingResponseSchema> => {
    const matchesMatch = doc.pageContent.match(/Student Matches:\s*([\s\S]+)/s);
    const matches: Array<{ left: string; right: string }> = [];

    if (matchesMatch) {
        const matchLines = matchesMatch[1].trim().split('\n');
        for (const line of matchLines) {
            const pairMatch = line.match(/^\d+\.\s*(.+?)\s*->\s*(.+)$/);
            if (pairMatch) {
                matches.push({
                    left: pairMatch[1].trim(),
                    right: pairMatch[2].trim()
                });
            }
        }
    }

    return { matches };
};

/**
 * Response: Short Answer
 */
export const blockShortAnswerResponseSchema = z.object({
    answer: z.string()
});

export const blockShortAnswerResponseToDocument = (response: z.infer<typeof blockShortAnswerResponseSchema>): Document => {
    return new Document({
        pageContent: `Student Answer: ${response.answer}`,
    });
};

export const blockShortAnswerResponseFromDocument = (doc: Document): z.infer<typeof blockShortAnswerResponseSchema> => {
    const answerMatch = doc.pageContent.match(/Student Answer:\s*(.+)/s);
    return {
        answer: answerMatch ? answerMatch[1].trim() : ''
    };
};

/**
 * Response: Close (Close/Answer Blank)
 */
export const blockCloseResponseSchema = z.object({
    answers: z.array(z.string())
});

export const blockCloseResponseToDocument = (response: z.infer<typeof blockCloseResponseSchema>): Document => {
    return new Document({
        pageContent: `Student Answers: ${response.answers.join(', ')}`,
    });
};

export const blockCloseResponseFromDocument = (doc: Document): z.infer<typeof blockCloseResponseSchema> => {
    const answersMatch = doc.pageContent.match(/Student Answers:\s*(.+)/s);
    return {
        answers: answersMatch ? answersMatch[1].split(',').map(ans => ans.trim()) : []
    };
};

/**
 * Response: Highlight Text
 */
export const blockHighlightTextResponseSchema = z.object({
    selectedText: z.array(z.string())
});

export const blockHighlightTextResponseToDocument = (response: z.infer<typeof blockHighlightTextResponseSchema>): Document => {
    return new Document({
        pageContent: `Highlighted Selections: ${response.selectedText.join(', ')}`,
    });
};

export const blockHighlightTextResponseFromDocument = (doc: Document): z.infer<typeof blockHighlightTextResponseSchema> => {
    const selectionsMatch = doc.pageContent.match(/Highlighted Selections:\s*(.+)/s);
    return {
        selectedText: selectionsMatch ? selectionsMatch[1].split(',').map(sel => sel.trim()) : []
    };
};

/**
 * Response: Graph
 */
export const blockGraphResponseSchema = z.object({
    studentPlots: z.array(z.object({
        id: z.string(),
        equation: z.string(),
        color: z.string(),
        label: z.string()
    }))
});

export const blockGraphResponseToDocument = (response: z.infer<typeof blockGraphResponseSchema>): Document => {
    const plotsText = response.studentPlots.map(plot => `ID: ${plot.id}, Equation: ${plot.equation}, Color: ${plot.color}, Label: ${plot.label}`).join('\n');
    return new Document({
        pageContent: `Student Plots:\n${plotsText}`,
    });
};

export const blockGraphResponseFromDocument = (doc: Document): z.infer<typeof blockGraphResponseSchema> => {
    const plotsMatch = doc.pageContent.match(/Student Plots:\s*([\s\S]+)/s);
    const studentPlots: Array<{ id: string; equation: string; color: string; label: string }> = [];

    if (plotsMatch) {
        const plotsLines = plotsMatch[1].trim().split('\n');
        for (const line of plotsLines) {
            const plotMatch = line.match(/ID:\s*(.+?),\s*Equation:\s*(.+?),\s*Color:\s*(.+?),\s*Label:\s*(.+)/);
            if (plotMatch) {
                studentPlots.push({
                    id: plotMatch[1].trim(),
                    equation: plotMatch[2].trim(),
                    color: plotMatch[3].trim(),
                    label: plotMatch[4].trim()
                });
            }
        }
    }

    return { studentPlots };
};

/**
 * Response: Balancing Equations
 */
export const blockBalancingEquationsResponseSchema = z.object({
    coefficients: z.object({
        reactants: z.array(z.number()),
        products: z.array(z.number())
    })
});

export const blockBalancingEquationsResponseToDocument = (response: z.infer<typeof blockBalancingEquationsResponseSchema>): Document => {
    return new Document({
        pageContent: `Reactant Coefficients: ${response.coefficients.reactants.join(', ')}\nProduct Coefficients: ${response.coefficients.products.join(', ')}`,
    });
};

export const blockBalancingEquationsResponseFromDocument = (doc: Document): z.infer<typeof blockBalancingEquationsResponseSchema> => {
    const reactantsMatch = doc.pageContent.match(/Reactant Coefficients:\s*(.+?)\s*Product Coefficients:/s);
    const productsMatch = doc.pageContent.match(/Product Coefficients:\s*(.+)/s);
    
    return {
        coefficients: {
            reactants: reactantsMatch ? reactantsMatch[1].split(',').map(c => parseInt(c.trim(), 10)) : [],
            products: productsMatch ? productsMatch[1].split(',').map(c => parseInt(c.trim(), 10)) : []
        }
    };
};

/**
 * Union of all task block response schemas
 */
export const taskBlockResponseSchema = z.union([
    blockMathInputResponseSchema,
    blockChoiceResponseSchema,
    blockFillBlankResponseSchema,
    blockMatchingResponseSchema,
    blockShortAnswerResponseSchema,
    blockCloseResponseSchema,
    blockHighlightTextResponseSchema,
    blockGraphResponseSchema,
    blockBalancingEquationsResponseSchema
]);

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
 * Get the Zod response schema for a specific task block type
 * @param blockType 
 * @returns 
 */
export function getBlockResponseSchema(blockType: taskBlockTypeEnum): z.ZodSchema | undefined {
    return blockTypeToResponseSchemaMap[blockType];
}

/**
 * Mapping block types to their response schemas (for easy lookup)
 * Only interactive blocks that require student responses have entries
 */
export const blockTypeToResponseSchemaMap: Partial<Record<taskBlockTypeEnum, z.ZodSchema>> = {
    [taskBlockTypeEnum.mathInput]: blockMathInputResponseSchema,
    [taskBlockTypeEnum.choice]: blockChoiceResponseSchema,
    [taskBlockTypeEnum.fillBlank]: blockFillBlankResponseSchema,
    [taskBlockTypeEnum.matching]: blockMatchingResponseSchema,
    [taskBlockTypeEnum.shortAnswer]: blockShortAnswerResponseSchema,
    [taskBlockTypeEnum.close]: blockCloseResponseSchema,
    [taskBlockTypeEnum.highlightText]: blockHighlightTextResponseSchema,
    [taskBlockTypeEnum.graph]: blockGraphResponseSchema,
    [taskBlockTypeEnum.balancingEquations]: blockBalancingEquationsResponseSchema
};

/**
 * Get the Zod schemas for all task blocks in a specific subject group
 * @param subjectGroup 
 * @returns 
 */
export function getBlocksForSubjectGroup(subjectGroup: subjectGroupEnum): z.ZodSchema[] {
    switch (subjectGroup) {
        case subjectGroupEnum.mathematics:
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
 * @param requirements - Which fields to include
 */
export function extendBlockSchema<T extends z.ZodTypeAny>(
    baseSchema: T, 
    requirements: {
        includeMarks?: boolean,
        includeCriteria?: boolean, 
        includeDifficulty?: boolean, 
        includeHints?: boolean, 
        includeSteps?: boolean 
    } = {}
): z.ZodSchema {
    const {
        includeMarks = false,
        includeCriteria = false,
        includeDifficulty = false,
        includeHints = false,
        includeSteps = false
    } = requirements;

    // Build extension object for config
    const configExtensions: Record<string, z.ZodTypeAny> = {};

    if (includeMarks) {
        configExtensions.marks = z.number().describe('Number of marks awarded for this task block');
    }

    if (includeCriteria) {
        configExtensions.criteria = z.array(criteriaItemSchema).min(1);
    }

    if (includeDifficulty) {
        configExtensions.difficulty = difficultySchema;
    }

    if (includeHints) {
        configExtensions.hints = hintsSchema;
    }

    if (includeSteps) {
        configExtensions.steps = stepsSchema;
    }

    // If no extensions, return original schema
    if (Object.keys(configExtensions).length === 0) {
        return baseSchema;
    }

    // Parse the base schema
    if (baseSchema instanceof z.ZodObject) {
        const shape = baseSchema.shape;
        
        // Check if the schema has a 'config' field that's also a ZodObject
        if (shape.config && shape.config instanceof z.ZodObject) {
            const extendedConfig = shape.config.extend(configExtensions);
            
            return z.object({
                type: shape.type,
                config: extendedConfig
            });
        }
    }

    // If schema structure doesn't match expected format, return as-is
    return baseSchema;
}

  /**
   * Helper to determine requirements based on task type
   */
export function getRequirementsForTaskType(taskType: taskTypeEnum) {
switch (taskType) {
    case taskTypeEnum.assessment:
    return {
        includeMarks: true,
        includeCriteria: true,
        includeDifficulty: true,
        includeHints: false,
        includeSteps: false
    };
    case taskTypeEnum.homework:
    return {
        includeMarks: true,
        includeCriteria: false,
        includeDifficulty: true,
        includeHints: true,
        includeSteps: true
    };
    case taskTypeEnum.lesson:
    return {
        includeMarks: false,
        includeCriteria: false,
        includeDifficulty: true,
        includeHints: true,
        includeSteps: false
    };
    default:
    return {
        includeMarks: false,
        includeCriteria: false,
        includeDifficulty: false,
        includeHints: false,
        includeSteps: false
    };
}
}
