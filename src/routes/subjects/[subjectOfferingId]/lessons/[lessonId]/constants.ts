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
import type { Icon } from '@lucide/svelte';

export const blockTypes: {
	type: string;
	content: unknown;
	icon: typeof Icon;
}[] = [
	{
		type: 'h1',
		content: 'This is a Heading 1',
		icon: HeadingOneIcon
	},
	{
		type: 'h2',
		content: 'This is a Heading 2',
		icon: HeadingTwoIcon
	},
	{
		type: 'h3',
		content: 'This is a Heading 3',
		icon: HeadingThreeIcon
	},
	{
		type: 'h4',
		content: 'This is a Heading 4',
		icon: HeadingFourIcon
	},
	{
		type: 'h5',
		content: 'This is a Heading 5',
		icon: HeadingFiveIcon
	},
	{
		type: 'markdown',
		content: 'This is markdown content...',
		icon: PilcrowIcon
	},
	{
		type: 'image',
		content: { src: '', alt: 'Image', caption: '' },
		icon: ImageIcon
	},
	{
		type: 'video',
		content: { src: '', title: 'Video' },
		icon: FilmIcon
	},
	{
		type: 'audio',
		content: { src: '', title: 'Audio' },
		icon: AudioLinesIcon
	},
	{
		type: 'whiteboard',
		content: { data: '', width: 800, height: 600 },
		icon: PresentationIcon
	},
	{
		type: 'multiple_choice',
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
		type: 'fill_in_blank',
		content: {
			sentence: 'Fill in the blank _____.',
			answer: 'Answer'
		},
		icon: PenToolIcon
	}
];
