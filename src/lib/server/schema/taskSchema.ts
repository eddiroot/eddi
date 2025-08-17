import { taskBlockTypeEnum } from '$lib/enums';

export const taskCreationPrompts = {
	lesson: (
		title: string,
		description: string = ''
	) => `Use the following as background context to help generate an educational lesson:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create a comprehensive lesson with:
    1. A subtitle as a h2. Do not include a title.
    2. A number of sections matching the complexity of the content. Sections shouldn't be too long. Sections should have appropriate headers (h1, h2, h3)
    3. Explanatory content using paragraphs and markdown
    4. Interactive elements to engage students including:
        - Multiple choice questions (both single and multiple answer), and answers are string of options (not a,b,c or 1,2,3) - component type: multiple_choice
        - Fill in the blank questions (use the format "_____" for blanks, 5 underscores) limit to maximum 3 - component type: fill_in_blank
				- Math input problems (if applicable) for calculation practice - component type: math_input
    5. A good balance of explanation and interactive practice
Each component should be structured according to the provided schema. Ignore the short answer component type as it is not needed for lessons.`,

	homework: (
		title: string,
		description: string = ''
	) => `Use the following as background context to help generate homework assignments:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create homework that reinforces learning with:
    - Focus primarily on these question components: short_answer, matching, fill_in_blank, multiple_choice, and math_input. Use headers and paragraphs only when introducing or explaining questions.
    - Ensure you include at least one \`short_answer\` component for open-ended written responses.
    1. A subtitle as a h2 about the homework. Do not include a title.
    2. Brief instructions or review sections with headers (h2, h3, h4, h5, h6)
    3. Practice problems and exercises including:
        - Multiple choice questions for self-assessment (make sure answers are string of options (not a,b,c or 1,2,3))
        - Fill in the blank exercises for key concepts (use the format "_____" for blanks, 5 underscores) limit to maximum 3
        - Math input problems (if applicable) for calculation practice
        - Text input questions for written responses
        - Matching activities to connect concepts
    4. Focus primarily on practice questions rather than lengthy explanations
    5. Progressive difficulty from basic recall to application
    6. Clear instructions for each section
    - For every block that has an **answer**, also include a **marks** field (number ≥ 1).
    - If a block includes **criteria**, provide one or more criteria objects:
        • Each object needs { description, marks }
        • The sum of criteria.marks must equal the block's marks.
    - In lessons, you may leave marks blank or 0; in homework and assessments, marks are required.
Each component should be structured according to the provided schema. Prioritize interactive practice over explanatory content.`,

	assessment: (
		title: string,
		description: string = ''
	) => `Use the following as background context to help generate a comprehensive assessment:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create an assessment that evaluates student understanding with:
    - Focus primarily on these question components: short_answer, matching, fill_in_blank, multiple_choice, and math_input. Use headers and paragraphs only when introducing or explaining questions.
    - Ensure you include at least one \`short_answer\` component for open-ended evaluation.
    1. A clear assessment subtitle and brief instructions. Do not include a title.
    2. Varied question types to test different skill levels:
        - Multiple choice questions (both single and multiple answer) for knowledge and comprehension (make sure answers are string of options (not a,b,c or 1,2,3))
        - Fill in the blank questions for key terminology and concepts (use the format "_____" for blanks, 5 underscores) limit to maximum 3
        - Math input questions (if applicable) for problem-solving skills
        - Text input questions for analysis and evaluation
        - Matching activities for concept connections
    3. Questions that progress from basic recall to higher-order thinking
    4. Clear, unambiguous question wording
    5. Comprehensive coverage of the topic material
    6. Minimal explanatory content - focus on evaluation questions
    - For every block that has an **answer**, also include a **marks** field (number ≥ 1).
    - If a block includes **criteria**, provide one or more criteria objects:
        • Each object needs { description, marks }
        • The sum of criteria.marks must equal the block's marks.
    - In lessons, you may leave marks blank or 0; in homework and assessments, marks are required.
Each component should be structured according to the provided schema. Prioritize assessment questions over instructional content.`
};

const criteriaItem = {
	type: 'object',
	properties: {
		description: { type: 'string' },
		marks: { type: 'number' }
	},
	required: ['description', 'marks']
};

export const blockHeading = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.heading] },
		config: {
			type: 'object',
			properties: {
				text: { type: 'string' },
				size: { type: 'number' }
			},
			required: ['text', 'size']
		}
	},
	required: ['type', 'config']
};

export type BlockHeadingConfig = {
	text: string;
	size: number;
};

export const blockRichText = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.richText] },
		config: {
			type: 'object',
			properties: {
				html: { type: 'string' }
			},
			required: ['html']
		}
	},
	required: ['type', 'config']
};

export type BlockRichTextConfig = {
	html: string;
};

export const blockMathInput = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.mathInput] },
		config: {
			type: 'object',
			properties: {
				question: { type: 'string' },
				answer: { type: 'string' }
			},
			required: ['question', 'answer']
		},
		criteria: {
			type: 'array',
			items: criteriaItem,
			minItems: 1
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config', 'criteria']
};

export type BlockMathInputConfig = {
	question: string;
	answer: string;
};

export const blockChoice = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.choice] },
		config: {
			type: 'object',
			properties: {
				question: { type: 'string' },
				options: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							text: { type: 'string' },
							isAnswer: { type: 'boolean' }
						},
						description:
							'Array of objects containing the choices and whether that choice is an answer. To make only a single answer valid, the array should contain only one item with isAnswer as true.'
					}
				}
			},
			required: ['question', 'options']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockChoiceConfig = {
	question: string;
	options: {
		text: string;
		isAnswer: boolean;
	}[];
};

export const blockFillBlank = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.fillBlank] },
		config: {
			type: 'object',
			properties: {
				sentence: { type: 'string' },
				answer: { type: 'string' }
			},
			required: ['sentence', 'answer']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockFillBlankConfig = {
	sentence: string;
	answer: string;
};

export const blockMatching = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.matching] },
		config: {
			type: 'object',
			properties: {
				instructions: { type: 'string' },
				pairs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							left: { type: 'string' },
							right: { type: 'string' }
						},
						required: ['left', 'right']
					}
				}
			},
			required: ['instructions', 'pairs']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockMatchingConfig = {
	instructions: string;
	pairs: { left: string; right: string }[];
};

export const blockShortAnswer = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.shortAnswer] },
		config: {
			type: 'object',
			properties: {
				question: { type: 'string' }
			},
			required: ['question']
		},
		criteria: {
			type: 'array',
			items: criteriaItem,
			minItems: 1
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config', 'criteria']
};

export type BlockShortAnswerConfig = {
	question: string;
};

export const blockWhiteboard = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.whiteboard] },
		config: {
			type: 'object',
			properties: {
				title: { type: 'string' },
				whiteboardId: { type: 'number', nullable: true }
			},
			required: ['data', 'width', 'height']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockWhiteboardConfig = {
	title: string;
	whiteboardId: number | null;
};

export const taskComponentItems = [
	blockHeading,
	blockRichText,
	blockMathInput,
	blockChoice,
	blockFillBlank,
	blockMatching,
	blockShortAnswer
];

export const layoutTwoColumns = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: ['col_2'] },
		config: {
			type: 'object',
			properties: {
				leftColumn: {
					type: 'array',
					items: {
						anyOf: taskComponentItems
					}
				},
				rightColumn: {
					type: 'array',
					items: {
						anyOf: taskComponentItems
					}
				}
			},
			required: ['leftColumn', 'rightColumn']
		}
	},
	required: ['type', 'config']
};

export const taskLayoutItems = [layoutTwoColumns];

// Combined schema for all task items (components + layouts)
export const allTaskItems = [...taskComponentItems, ...taskLayoutItems];

export const taskComponentSchema = {
	type: 'object',
	properties: {
		task: {
			type: 'array',
			items: {
				anyOf: allTaskItems
			}
		}
	},
	required: ['task']
};
