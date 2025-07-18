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

// Shared criteria item schema for answer/criteria blocks
const criteriaItem = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    marks: { type: 'number' }
  },
  required: ['description', 'marks']
} as const;

export const headerComponent = {
	type: 'object',
	properties: {
		content: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['h2', 'h3', 'h4', 'h5', 'h6'] },
				content: {
					type: 'object',
					properties: {
						text: { type: 'string' }
					},
					required: ['text']
				}
			},
			required: ['type', 'content']
		}
	},
	required: ['content']
};

export const paragraphComponent = {
	type: 'object',
	properties: {
		content: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['paragraph'] },
				content: {
					type: 'object',
					properties: {
						markdown: { type: 'string' }
					},
					required: ['markdown']
				}
			},
			required: ['type', 'content']
		}
	},
	required: ['content']
};

export const mathInputComponent = {
	type: 'object',
	properties: {
		criteria: {
			type: 'array',
			items: criteriaItem,
			minItems: 1
		},
		answer: { type: 'string' },
		marks: { type: 'number' },
		content: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['math_input'] },
				content: {
					type: 'object',
					properties: {
						question: { type: 'string' },
						answer_latex: { type: 'string' }
					},
					required: ['question', 'answer_latex']
				}
			},
			required: ['type', 'content']
		}
	},
	required: ['criteria', 'answer', 'content']
};

export const multipleChoiceComponent = {
	type: 'object',
	properties: {
		answer: {
			type: 'array',
			items: { type: 'string' },
			description:
				'Array of strings that must be a subset of the options array. For single answer questions, array should contain one item. For multiple answer questions, array can contain multiple items.',
			minItems: 1
		},
		marks: { type: 'number' },
		content: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['multiple_choice'] },
				content: {
					type: 'object',
					properties: {
						question: { type: 'string' },
						options: {
							type: 'array',
							items: { type: 'string' }
						},
						multiple: { type: 'boolean' }
					},
					required: ['question', 'options', 'multiple']
				}
			},
			required: ['type', 'content']
		}
	},
	required: ['answer', 'content']
};

export const videoComponent = {
	type: 'object',
	properties: {
		content: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['video'] },
				content: {
					type: 'object',
					properties: {
						url: { type: 'string' },
						caption: { type: 'string' }
					},
					required: ['url', 'caption']
				}
			},
			required: ['type', 'content']
		}
	},
	required: ['content']
};

export const imageComponent = {
	type: 'object',
	properties: {
		content: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['image'] },
				content: {
					type: 'object',
					properties: {
						url: { type: 'string' },
						caption: { type: 'string' }
					},
					required: ['url', 'caption']
				}
			},
			required: ['type', 'content']
		}
	},
	required: ['content']
};

export const fillInBlankComponent = {
	type: 'object',
	properties: {
		answer: {
			type: 'array',
			items: { type: 'string' },
			minItems: 1
		},
		marks: { type: 'number' },
		content: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['fill_in_blank'] },
				content: {
					type: 'object',
					properties: {
						sentence: { type: 'string' }
					},
					required: ['sentence']
				}
			},
			required: ['type', 'content']
		}
	},
	required: ['answer', 'content']
};

export const matchingComponent = {
	type: 'object',
	properties: {
		answer: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					left: { type: 'string' },
					right: { type: 'string' }
				},
				required: ['left', 'right']
			},
			description: 'Array of correct pairs for the matching exercise'
		},
		marks: { type: 'number' },
		content: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['matching'] },
				content: {
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
				}
			},
			required: ['type', 'content']
		}
	},
	required: ['answer', 'content']
};

export const shortAnswerComponent = {
	type: 'object',
	properties: {
		criteria: {
			type: 'array',
			items: criteriaItem,
			minItems: 1
		},
		marks: { type: 'number' },
		content: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['short_answer'] },
				content: {
					type: 'object',
					properties: {
						question: { type: 'string' }
					},
					required: ['question']
				}
			},
			required: ['type', 'content']
		}
	},
	required: ['criteria', 'content']
};

export const taskComponentItems = [
	headerComponent,
	paragraphComponent,
	mathInputComponent,
	multipleChoiceComponent,
	videoComponent,
	imageComponent,
	fillInBlankComponent,
	matchingComponent,
	shortAnswerComponent
];

export const taskLayoutItems = [
	{
		type: 'object',
		properties: {
			type: { type: 'string', enum: ['two_column_layout'] },
			content: {
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
		required: ['type', 'content']
	}
];

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
