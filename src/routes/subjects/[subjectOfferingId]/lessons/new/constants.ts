export const lessonCreationPrompts = {
	lesson: `Analyse the attached documents/images and create an educational lesson.

Using the provided schema, create a comprehensive lesson with:
    1. A title and subtitle
    2. A number of sections matching the complexity of the content. Sections shouldn't be too long. Sections should have appropriate headers (h1, h2, h3)
    3. Explanatory content using paragraphs and markdown
    4. Interactive elements to engage students including:
        - Multiple choice questions (both single and multiple answer) for knowledge checking (make sure answers are string of options)
        - Math input questions (if applicable)
        - Fill in the blank questions (use the format "_____" for blanks)
        - Text input questions for open-ended responses
        - Matching or drag-and-drop activities for concept reinforcement
    5. A good balance of explanation and interactive practice
Each component should be structured according to the provided schema.`,

	homework: `Analyse the attached documents/images and create homework assignments.

Using the provided schema, create homework that reinforces learning with:
    1. A clear title describing the homework assignment
    2. Brief instructions or review sections with headers (h1, h2, h3)
    3. Practice problems and exercises including:
        - Multiple choice questions for self-assessment (make sure answers are string of options)
        - Fill in the blank exercises for key concepts (use the format "_____" for blanks)
        - Math input problems (if applicable) for calculation practice
        - Text input questions for written responses
        - Matching activities to connect concepts
    4. Focus primarily on practice questions rather than lengthy explanations
    5. Progressive difficulty from basic recall to application
    6. Clear instructions for each section
Each component should be structured according to the provided schema. Prioritize interactive practice over explanatory content.`,

	assessment: `Analyse the attached documents/images and create a comprehensive assessment.

Using the provided schema, create an assessment that evaluates student understanding with:
    1. A clear assessment title and brief instructions
    2. Varied question types to test different skill levels:
        - Multiple choice questions (both single and multiple answer) for knowledge and comprehension (make sure answers are string of options)
        - Fill in the blank questions for key terminology and concepts (use the format "_____" for blanks)
        - Math input questions (if applicable) for problem-solving skills
        - Text input questions for analysis and evaluation
        - Matching activities for concept connections
    3. Questions that progress from basic recall to higher-order thinking
    4. Clear, unambiguous question wording
    5. Comprehensive coverage of the topic material
    6. Minimal explanatory content - focus on evaluation questions
Each component should be structured according to the provided schema. Prioritize assessment questions over instructional content.`
};

// Keep the original as the default for backward compatibility
export const lessonCreationPrompt = lessonCreationPrompts.lesson;

// Base lesson component schema (reusable)
export const lessonComponentItems = [
	// Title component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['title'] },
			content: {
				type: 'OBJECT',
				properties: {
					text: { type: 'STRING' }
				},
				required: ['text']
			}
		},
		required: ['type', 'content']
	},

	// Subtitle component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['subtitle'] },
			content: {
				type: 'OBJECT',
				properties: {
					text: { type: 'STRING' }
				},
				required: ['text']
			}
		},
		required: ['type', 'content']
	},

	// Header components (h1, h2, h3)
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['h1', 'h2', 'h3'] },
			content: {
				type: 'OBJECT',
				properties: {
					text: { type: 'STRING' }
				},
				required: ['text']
			}
		},
		required: ['type', 'content']
	},

	// Paragraph component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['paragraph'] },
			content: {
				type: 'OBJECT',
				properties: {
					markdown: { type: 'STRING' }
				},
				required: ['markdown']
			}
		},
		required: ['type', 'content']
	},

	// Math input component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['math_input'] },
			content: {
				type: 'OBJECT',
				properties: {
					question: { type: 'STRING' },
					answer_latex: { type: 'STRING' }
				},
				required: ['question', 'answer_latex']
			}
		},
		required: ['type', 'content']
	},

	// Text/Number input component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['input'] },
			content: {
				type: 'OBJECT',
				properties: {
					question: { type: 'STRING' },
					input_type: { type: 'STRING', enum: ['text', 'number'] },
					unit: { type: 'STRING', nullable: true }
				},
				required: ['question', 'input_type']
			}
		},
		required: ['type', 'content']
	},

	// Multiple choice component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['multiple_choice'] },
			content: {
				type: 'OBJECT',
				properties: {
					question: { type: 'STRING' },
					options: {
						type: 'ARRAY',
						items: { type: 'STRING' }
					},
					answer: {
						oneOf: [
							{ type: 'STRING' },
							{
								type: 'ARRAY',
								items: { type: 'STRING' }
							}
						]
					},
					multiple: { type: 'BOOLEAN' }
				},
				required: ['question', 'options', 'answer', 'multiple']
			}
		},
		required: ['type', 'content']
	},

	// Video component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['video'] },
			content: {
				type: 'OBJECT',
				properties: {
					url: { type: 'STRING' },
					caption: { type: 'STRING' }
				},
				required: ['url', 'caption']
			}
		},
		required: ['type', 'content']
	},

	// Image component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['image'] },
			content: {
				type: 'OBJECT',
				properties: {
					url: { type: 'STRING' },
					caption: { type: 'STRING' }
				},
				required: ['url', 'caption']
			}
		},
		required: ['type', 'content']
	},

	// Fill in the blank component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['fill_in_blank'] },
			content: {
				type: 'OBJECT',
				properties: {
					sentence: { type: 'STRING' },
					answer: { type: 'STRING' }
				},
				required: ['sentence', 'answer']
			}
		},
		required: ['type', 'content']
	},

	// Matching component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['matching'] },
			content: {
				type: 'OBJECT',
				properties: {
					instructions: { type: 'STRING' },
					pairs: {
						type: 'ARRAY',
						items: {
							type: 'OBJECT',
							properties: {
								left: { type: 'STRING' },
								right: { type: 'STRING' }
							},
							required: ['left', 'right']
						}
					}
				},
				required: ['instructions', 'pairs']
			}
		},
		required: ['type', 'content']
	},

	// Drag and drop component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['drag_and_drop'] },
			content: {
				type: 'OBJECT',
				properties: {
					instructions: { type: 'STRING' },
					categories: {
						type: 'ARRAY',
						items: {
							type: 'OBJECT',
							properties: {
								name: { type: 'STRING' },
								items: {
									type: 'ARRAY',
									items: { type: 'STRING' }
								}
							},
							required: ['name', 'items']
						}
					},
					options: {
						type: 'ARRAY',
						items: { type: 'STRING' }
					}
				},
				required: ['instructions', 'categories', 'options']
			}
		},
		required: ['type', 'content']
	}
];

// Layout components schema
export const lessonLayoutItems = [
	// Two column layout component
	{
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['two_column_layout'] },
			content: {
				type: 'OBJECT',
				properties: {
					leftColumn: {
						type: 'ARRAY',
						items: {
							anyOf: lessonComponentItems
						}
					},
					rightColumn: {
						type: 'ARRAY',
						items: {
							anyOf: lessonComponentItems
						}
					}
				},
				required: ['leftColumn', 'rightColumn']
			}
		},
		required: ['type', 'content']
	}
];

// Combined schema for all lesson items (components + layouts)
export const allLessonItems = [...lessonComponentItems, ...lessonLayoutItems];

// Original lesson component schema (for backwards compatibility)
export const lessonComponentSchema = {
	type: 'OBJECT',
	properties: {
		lesson: {
			type: 'ARRAY',
			items: {
				anyOf: allLessonItems
			}
		}
	},
	required: ['lesson']
};

// New schema specifically for layouts that can contain other components
export const lessonLayoutSchema = {
	type: 'OBJECT',
	properties: {
		lesson: {
			type: 'ARRAY',
			items: {
				anyOf: lessonLayoutItems
			}
		}
	},
	required: ['lesson']
};

// Schema for just basic components (no layouts)
export const basicComponentSchema = {
	type: 'OBJECT',
	properties: {
		lesson: {
			type: 'ARRAY',
			items: {
				anyOf: lessonComponentItems
			}
		}
	},
	required: ['lesson']
};
