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
import type { Icon } from '@lucide/svelte';
import { taskBlockTypeEnum } from '$lib/enums';

export enum ViewMode {
	EDIT = 'edit',
	VIEW = 'view',
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
			sentence: 'Fill in the _____.',
			answer: 'answer'
		},
		icon: PenToolIcon
	},
	{
		type: taskBlockTypeEnum.shortAnswer,
		name: 'Short Answer',
		initialConfig: {
			question: 'Question'
		},
		icon: PenToolIcon
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
	}
];
