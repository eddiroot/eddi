import HeadingOneIcon from '@lucide/svelte/icons/heading-1';
import HeadingTwoIcon from '@lucide/svelte/icons/heading-2';
import HeadingThreeIcon from '@lucide/svelte/icons/heading-3';
import HeadingFourIcon from '@lucide/svelte/icons/heading-4';
import HeadingFiveIcon from '@lucide/svelte/icons/heading-5';
import PilcrowIcon from '@lucide/svelte/icons/pilcrow';
import ImageIcon from '@lucide/svelte/icons/image';
import FilmIcon from '@lucide/svelte/icons/film';
import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';
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
	content: unknown;
	icon: typeof Icon;
}[] = [
	{
		type: taskBlockTypeEnum.h1,
		name: 'Heading 1',
		content: 'This is a Heading 1',
		icon: HeadingOneIcon
	},
	{
		type: taskBlockTypeEnum.h2,
		name: 'Heading 2',
		content: 'This is a Heading 2',
		icon: HeadingTwoIcon
	},
	{
		type: taskBlockTypeEnum.h3,
		name: 'Heading 3',
		content: 'This is a Heading 3',
		icon: HeadingThreeIcon
	},
	{
		type: taskBlockTypeEnum.h4,
		name: 'Heading 4',
		content: 'This is a Heading 4',
		icon: HeadingFourIcon
	},
	{
		type: taskBlockTypeEnum.h5,
		name: 'Heading 5',
		content: 'This is a Heading 5',
		icon: HeadingFiveIcon
	},
	{
		type: taskBlockTypeEnum.richText,
		name: 'Rich Text',
		content: '',
		icon: PilcrowIcon
	},
	{
		type: taskBlockTypeEnum.image,
		name: 'Image',
		content: { src: '', alt: 'Image', caption: '' },
		icon: ImageIcon
	},
	{
		type: taskBlockTypeEnum.video,
		name: 'Video',
		content: { src: '', title: 'Video' },
		icon: FilmIcon
	},
	{
		type: taskBlockTypeEnum.audio,
		name: 'Audio',
		content: { src: '', title: 'Audio' },
		icon: AudioLinesIcon
	},
	{
		type: taskBlockTypeEnum.whiteboard,
		name: 'Whiteboard',
		content: { data: '', width: 800, height: 600 },
		icon: PresentationIcon
	},
	{
		type: taskBlockTypeEnum.multipleChoice,
		name: 'Multiple Choice',
		content: {
			question: 'Sample multiple choice question?',
			options: ['Option 1', 'Option 2'],
			answer: 'Option 1',
			multiple: false
		},
		icon: List
	},
	{
		type: taskBlockTypeEnum.fillInBlank,
		name: 'Fill in the Blank',
		content: {
			sentence: 'Fill in the blank _____.',
			answer: 'Answer'
		},
		icon: PenToolIcon
	},
	{
		type: taskBlockTypeEnum.shortAnswer,
		name: 'Short Answer',
		content: {
			question: 'Question'
		},
		icon: PenToolIcon
	},
	{
		type: taskBlockTypeEnum.matching,
		name: 'Matching Pairs',
		content: {
			instructions: 'Match the items on the left with the correct answers on the right.',
			pairs: [
				{ left: 'Item 1', right: 'Answer 1' },
				{ left: 'Item 2', right: 'Answer 2' }
			]
		},
		icon: LinkIcon
	}
];
