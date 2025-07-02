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
import { lessonBlockTypeEnum } from '$lib/server/db/schema';
import type { Icon } from '@lucide/svelte';

export const blockTypes: {
	type: lessonBlockTypeEnum;
	content: unknown;
	icon: typeof Icon;
}[] = [
	{
		type: lessonBlockTypeEnum.h1,
		content: 'This is a Heading 1',
		icon: HeadingOneIcon
	},
	{
		type: lessonBlockTypeEnum.h2,
		content: 'This is a Heading 2',
		icon: HeadingTwoIcon
	},
	{
		type: lessonBlockTypeEnum.h3,
		content: 'This is a Heading 3',
		icon: HeadingThreeIcon
	},
	{
		type: lessonBlockTypeEnum.h4,
		content: 'This is a Heading 4',
		icon: HeadingFourIcon
	},
	{
		type: lessonBlockTypeEnum.h5,
		content: 'This is a Heading 5',
		icon: HeadingFiveIcon
	},
	{
		type: lessonBlockTypeEnum.markdown,
		content: 'This is markdown content...',
		icon: PilcrowIcon
	},
	{
		type: lessonBlockTypeEnum.image,
		content: { src: '', alt: 'Image', caption: '' },
		icon: ImageIcon
	},
	{
		type: lessonBlockTypeEnum.video,
		content: { src: '', title: 'Video' },
		icon: FilmIcon
	},
	{
		type: lessonBlockTypeEnum.audio,
		content: { src: '', title: 'Audio' },
		icon: AudioLinesIcon
	},
	{
		type: lessonBlockTypeEnum.whiteboard,
		content: { data: '', width: 800, height: 600 },
		icon: PresentationIcon
	},
	{
		type: lessonBlockTypeEnum.multipleChoice,
		content: {
			question: 'Multiple Choice Question',
			options: [
				{ text: 'Option 1', isCorrect: true },
				{ text: 'Option 2', isCorrect: false }
			]
		},
		icon: List
	},
	{
		type: lessonBlockTypeEnum.fillInBlank,
		content: {
			sentence: 'Fill in the blank _____.',
			answer: 'Answer'
		},
		icon: PenToolIcon
	}
];
