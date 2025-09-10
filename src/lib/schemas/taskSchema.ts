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

export type BlockMathInputResponse = {
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

export type BlockChoiceResponse = {
	answers: string[];
};

export const blockFillBlank = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.fillBlank] },
		config: {
			type: 'object',
			properties: {
				sentence: { type: 'string' },
				answers: {
					type: 'array',
					items: { type: 'string' }
				}
			},
			required: ['sentence', 'answers']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockFillBlankConfig = {
	sentence: string;
	answers: string[];
};

export type BlockFillBlankResponse = {
	answers: string[];
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

export type BlockMatchingResponse = {
	matches: { left: string; right: string }[];
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

export type BlockShortAnswerResponse = {
	answer: string;
};

export const blockClose = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.close] },
		config: {
			type: 'object',
			properties: {
				text: { type: 'string' }
			},
			required: ['text']
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

export type BlockCloseConfig = {
	text: string;
};

export type BlockCloseResponse = {
	answers: string[];
};

export const blockHighlightText = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.highlightText] },
		config: {
			type: 'object',
			properties: {
				text: { type: 'string' },
				instructions: { type: 'string' },
				highlightCorrect: { type: 'boolean' }
			},
			required: ['text', 'instructions', 'highlightCorrect']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockHighlightTextConfig = {
	text: string;
	instructions: string;
	highlightCorrect: boolean;
};

export type BlockHighlightTextResponse = {
	selectedText: string[];
};

export const blockTable = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.table] },
		config: {
			type: 'object',
			properties: {
				title: { type: 'string' },
				rows: { type: 'number' },
				columns: { type: 'number' },
				data: {
					type: 'array',
					items: {
						type: 'array',
						items: { type: 'string' }
					}
				}
			},
			required: ['title', 'rows', 'columns', 'data']
		}
	},
	required: ['type', 'config']
};

export type BlockTableConfig = {
	title: string;
	rows: number;
	columns: number;
	data: string[][];
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

export const blockGraph = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.graph] },
		config: {
			type: 'object',
			properties: {
				title: { type: 'string' },
				xAxisLabel: { type: 'string' },
				yAxisLabel: { type: 'string' },
				xRange: {
					type: 'object',
					properties: {
						min: { type: 'number' },
						max: { type: 'number' }
					},
					required: ['min', 'max']
				},
				yRange: {
					type: 'object',
					properties: {
						min: { type: 'number' },
						max: { type: 'number' }
					},
					required: ['min', 'max']
				},
				staticPlots: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							equation: { type: 'string' },
							color: { type: 'string' },
							label: { type: 'string' }
						},
						required: ['id', 'equation', 'color', 'label']
					}
				}
			},
			required: ['title', 'xAxisLabel', 'yAxisLabel', 'xRange', 'yRange', 'staticPlots']
		}
	},
	required: ['type', 'config']
};

export type BlockGraphConfig = {
	title: string;
	xAxisLabel: string;
	yAxisLabel: string;
	xRange: { min: number; max: number };
	yRange: { min: number; max: number };
	staticPlots: {
		id: string;
		equation: string;
		color: string;
		label: string;
	}[];
};

export type BlockGraphResponse = {
	studentPlots: {
		id: string;
		equation: string;
		color: string;
		label: string;
	}[];
};

export const taskBlocks = [
	blockHeading,
	blockRichText,
	blockMathInput,
	blockChoice,
	blockFillBlank,
	blockMatching,
	blockShortAnswer,
	blockClose,
	blockHighlightText,
	blockTable,
	blockGraph
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
						anyOf: taskBlocks
					}
				},
				rightColumn: {
					type: 'array',
					items: {
						anyOf: taskBlocks
					}
				}
			},
			required: ['leftColumn', 'rightColumn']
		}
	},
	required: ['type', 'config']
};

export const taskLayouts = [layoutTwoColumns];

// Combined schema for all task items (components + layouts)
export const taskBlocksAndLayouts = [...taskBlocks, ...taskLayouts];

export const taskSchema = {
	type: 'object',
	properties: {
		blocks: {
			type: 'array',
			items: {
				// TODO: Change to taskBlocksAndLayouts once layouts are implemented
				anyOf: taskBlocks
			}
		}
	},
	required: ['task']
};

// Union type for all possible block configs
export type BlockConfig =
	| BlockHeadingConfig
	| BlockRichTextConfig
	| BlockChoiceConfig
	| BlockFillBlankConfig
	| BlockMatchingConfig
	| BlockShortAnswerConfig
	| BlockWhiteboardConfig
	| BlockCloseConfig
	| BlockHighlightTextConfig
	| BlockTableConfig
	| BlockGraphConfig;

export type BlockResponse =
	| BlockChoiceResponse
	| BlockFillBlankResponse
	| BlockMatchingResponse
	| BlockShortAnswerResponse
	| BlockCloseResponse
	| BlockHighlightTextResponse
	| BlockGraphResponse;

export type BlockProps<T extends BlockConfig = BlockConfig, Q extends BlockResponse = never> = {
	config: T;
	onConfigUpdate: (config: T) => Promise<void>;
	viewMode: ViewMode;
} & ([Q] extends [never]
	? object
	: {
		response: Q;
		onResponseUpdate: (response: Q) => Promise<void>;
	});

// Specific prop types for each block type
export type HeadingBlockProps = BlockProps<BlockHeadingConfig>;
export type RichTextBlockProps = BlockProps<BlockRichTextConfig>;
export type ChoiceBlockProps = BlockProps<BlockChoiceConfig, BlockChoiceResponse>;
export type FillBlankBlockProps = BlockProps<BlockFillBlankConfig, BlockFillBlankResponse>;
export type MatchingBlockProps = BlockProps<BlockMatchingConfig, BlockMatchingResponse>;
export type ShortAnswerBlockProps = BlockProps<BlockShortAnswerConfig, BlockShortAnswerResponse>;
export type WhiteboardBlockProps = BlockProps<BlockWhiteboardConfig>;
export type CloseBlockProps = BlockProps<BlockCloseConfig, BlockCloseResponse>;
export type HighlightTextBlockProps = BlockProps<
	BlockHighlightTextConfig,
	BlockHighlightTextResponse
>;
export type TableBlockProps = BlockProps<BlockTableConfig>;
export type GraphBlockProps = BlockProps<BlockGraphConfig, BlockGraphResponse>;

import HeadingOneIcon from '@lucide/svelte/icons/heading-1';
import HeadingTwoIcon from '@lucide/svelte/icons/heading-2';
import HeadingThreeIcon from '@lucide/svelte/icons/heading-3';
import HeadingFourIcon from '@lucide/svelte/icons/heading-4';
import HeadingFiveIcon from '@lucide/svelte/icons/heading-5';
import PilcrowIcon from '@lucide/svelte/icons/pilcrow';
import PresentationIcon from '@lucide/svelte/icons/presentation';
import List from '@lucide/svelte/icons/list';
import PenToolIcon from '@lucide/svelte/icons/pen-tool';
import LinkIcon from '@lucide/svelte/icons/link';
import HighlighterIcon from '@lucide/svelte/icons/highlighter';
import MessageSquareTextIcon from '@lucide/svelte/icons/message-square-text';
import TableIcon from '@lucide/svelte/icons/table';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import type { Icon } from '@lucide/svelte';

export enum ViewMode {
	CONFIGURE = 'configure',
	ANSWER = 'answer',
	REVIEW = 'review',
	PRESENT = 'present'
}

export const blockTypes: {
	type: string;
	name: string;
	initialConfig: Record<string, unknown>;
	icon: typeof Icon;
}[] = [
		{
			type: taskBlockTypeEnum.heading,
			name: 'Heading 1',
			initialConfig: { text: 'Heading 1', size: 2 },
			icon: HeadingOneIcon
		},
		{
			type: taskBlockTypeEnum.heading,
			name: 'Heading 2',
			initialConfig: { text: 'Heading 2', size: 3 },
			icon: HeadingTwoIcon
		},
		{
			type: taskBlockTypeEnum.heading,
			name: 'Heading 3',
			initialConfig: { text: 'Heading 3', size: 4 },
			icon: HeadingThreeIcon
		},
		{
			type: taskBlockTypeEnum.heading,
			name: 'Heading 4',
			initialConfig: { text: 'Heading 4', size: 5 },
			icon: HeadingFourIcon
		},
		{
			type: taskBlockTypeEnum.heading,
			name: 'Heading 5',
			initialConfig: { text: 'Heading 5', size: 6 },
			icon: HeadingFiveIcon
		},
		{
			type: taskBlockTypeEnum.richText,
			name: 'Rich Text',
			initialConfig: { html: 'This is a rich text block' },
			icon: PilcrowIcon
		},
		{
			type: taskBlockTypeEnum.whiteboard,
			name: 'Whiteboard',
			initialConfig: { data: '', width: 800, height: 600 },
			icon: PresentationIcon
		},
		{
			type: taskBlockTypeEnum.choice,
			name: 'Multiple Choice',
			initialConfig: {
				question: 'Sample multiple choice question?',
				options: [
					{ text: 'Option 1', isAnswer: false },
					{ text: 'Option 2', isAnswer: true }
				]
			},
			icon: List
		},
		{
			type: taskBlockTypeEnum.fillBlank,
			name: 'Fill Blank',
			initialConfig: {
				sentence: 'Fill in the _____ and _____.',
				answers: ['first blank', 'second blank']
			},
			icon: PenToolIcon
		},
		{
			type: taskBlockTypeEnum.close,
			name: 'Answer Blank',
			initialConfig: {
				text: 'Complete this sentence with _____ and _____.'
			},
			icon: PenToolIcon
		},
		{
			type: taskBlockTypeEnum.shortAnswer,
			name: 'Short Answer',
			initialConfig: {
				question: 'Question'
			},
			icon: MessageSquareTextIcon
		},
		{
			type: taskBlockTypeEnum.highlightText,
			name: 'Highlight Text',
			initialConfig: {
				text: 'Sample text for students to highlight key concepts and important information.',
				instructions: 'Highlight the correct information',
				highlightCorrect: true
			},
			icon: HighlighterIcon
		},
		{
			type: taskBlockTypeEnum.matching,
			name: 'Matching Pairs',
			initialConfig: {
				instructions: 'Match the items on the left with the correct answers on the right.',
				pairs: [
					{ left: 'Item 1', right: 'Answer 1' },
					{ left: 'Item 2', right: 'Answer 2' }
				]
			},
			icon: LinkIcon
		},
		{
			type: taskBlockTypeEnum.table,
			name: 'Table',
			initialConfig: {
				title: 'Table',
				rows: 3,
				columns: 3,
				data: [
					['Header 1', 'Header 2', 'Header 3'],
					['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
					['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3']
				]
			},
			icon: TableIcon
		},
		{
			type: taskBlockTypeEnum.graph,
			name: 'Graph',
			initialConfig: {
				title: 'Function Graph',
				xAxisLabel: 'x',
				yAxisLabel: 'y',
				xRange: { min: -10, max: 10 },
				yRange: { min: -10, max: 10 },
				staticPlots: []
			},
			icon: TrendingUpIcon
		}
	];
