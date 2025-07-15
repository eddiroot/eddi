export const taskCreationPrompts = {
	lesson: (
		title: string,
		description: string = ''
	) => `Create an educational lesson with the following details:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create a comprehensive lesson with:
    1. A subtitle as a h2. Do not include a title.
    2. A number of sections matching the complexity of the content. Sections shouldn't be too long. Sections should have appropriate headers (h1, h2, h3)
    3. Explanatory content using paragraphs and markdown
    4. Interactive elements to engage students including:
        - Multiple choice questions (both single and multiple answer), and answers are string of options (not a,b,c or 1,2,3) - component type: multiple_choice
        - Fill in the blank questions (use the format "_____" for blanks) limit to maximum 3 - component type: fill_in_blank
				- Math input problems (if applicable) for calculation practice - component type: math_input
    5. A good balance of explanation and interactive practice
Each component should be structured according to the provided schema. Ignore the short answer component type as it is not needed for lessons.`,

	homework: (
		title: string,
		description: string = ''
	) => `Create homework assignments with the following details:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create homework that reinforces learning with:
    1. A subtitle as a h2 about the homework. Do not include a title.
    2. Brief instructions or review sections with headers (h1, h2, h3)
    3. Practice problems and exercises including:
        - Multiple choice questions for self-assessment (make sure answers are string of options (not a,b,c or 1,2,3))
        - Fill in the blank exercises for key concepts (use the format "_____" for blanks) limit to maximum 3
        - Math input problems (if applicable) for calculation practice
        - Text input questions for written responses
        - Matching activities to connect concepts
    4. Focus primarily on practice questions rather than lengthy explanations
    5. Progressive difficulty from basic recall to application
    6. Clear instructions for each section
Each component should be structured according to the provided schema. Prioritize interactive practice over explanatory content.`,

	assessment: (
		title: string,
		description: string = ''
	) => `Create a comprehensive assessment with the following details:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create an assessment that evaluates student understanding with:
    1. A clear assessment subtitle and brief instructions. Do not include a title.
    2. Varied question types to test different skill levels:
        - Multiple choice questions (both single and multiple answer) for knowledge and comprehension (make sure answers are string of options (not a,b,c or 1,2,3))
        - Fill in the blank questions for key terminology and concepts (use the format "_____" for blanks) limit to maximum 3
        - Math input questions (if applicable) for problem-solving skills
        - Text input questions for analysis and evaluation
        - Matching activities for concept connections
    3. Questions that progress from basic recall to higher-order thinking
    4. Clear, unambiguous question wording
    5. Comprehensive coverage of the topic material
    6. Minimal explanatory content - focus on evaluation questions
Each component should be structured according to the provided schema. Prioritize assessment questions over instructional content.`
};

const titleComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
	}
};

const subtitleComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
	}
};

const headerComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['h2', 'h3', 'h4', 'h5', 'h6'] },
			content: {
				type: 'OBJECT',
				properties: {
					text: { type: 'STRING' }
				},
				required: ['text']
			}
		},
		required: ['type', 'content']
	}
};

const paragraphComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
	}
};

const mathInputComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
	}
};

const multipleChoiceComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
	}
};

const videoComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
	}
};

const imageComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
	}
};

const fillInBlankComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
	}
};

const matchingComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
	}
};

const dragAndDropComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
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
};

const shortAnswerComponent = {
	criteria: null,
	answer: null,
	blockSchema: {
		type: 'OBJECT',
		properties: {
			type: { type: 'STRING', enum: ['short_answer'] },
			content: {
				type: 'OBJECT',
				properties: {
					question: { type: 'STRING' }
				},
				required: ['question']
			}
		},
		required: ['type', 'content']
	}
};

export const taskComponentItems = [
	titleComponent.blockSchema,
	subtitleComponent.blockSchema,
	headerComponent.blockSchema,
	paragraphComponent.blockSchema,
	mathInputComponent.blockSchema,
	multipleChoiceComponent.blockSchema,
	videoComponent.blockSchema,
	imageComponent.blockSchema,
	fillInBlankComponent.blockSchema,
	matchingComponent.blockSchema,
	dragAndDropComponent.blockSchema,
	shortAnswerComponent.blockSchema
];

export const taskLayoutItems = [
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
							anyOf: taskComponentItems
						}
					},
					rightColumn: {
						type: 'ARRAY',
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
	type: 'OBJECT',
	properties: {
		task: {
			type: 'ARRAY',
			items: {
				anyOf: allTaskItems
			}
		}
	},
	required: ['task']
};
