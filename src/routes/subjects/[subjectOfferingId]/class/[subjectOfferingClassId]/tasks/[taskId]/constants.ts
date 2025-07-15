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
import ColumnsIcon from '@lucide/svelte/icons/columns';
import type { Icon } from '@lucide/svelte';

export const blockTypes: {
	type: string;
	name: string;
	content: unknown;
	icon: typeof Icon;
}[] = [
		{
			type: 'h1',
			name: 'Heading 1',
			content: 'This is a Heading 1',
			icon: HeadingOneIcon
		},
		{
			type: 'h2',
			name: 'Heading 2',
			content: 'This is a Heading 2',
			icon: HeadingTwoIcon
		},
		{
			type: 'h3',
			name: 'Heading 3',
			content: 'This is a Heading 3',
			icon: HeadingThreeIcon
		},
		{
			type: 'h4',
			name: 'Heading 4',
			content: 'This is a Heading 4',
			icon: HeadingFourIcon
		},
		{
			type: 'h5',
			name: 'Heading 5',
			content: 'This is a Heading 5',
			icon: HeadingFiveIcon
		},
		{
			type: 'markdown',
			name: 'Paragraph',
			content: 'This is markdown content...',
			icon: PilcrowIcon
		},
		{
			type: 'image',
			name: 'Image',
			content: { src: '', alt: 'Image', caption: '' },
			icon: ImageIcon
		},
		{
			type: 'video',
			name: 'Video',
			content: { src: '', title: 'Video' },
			icon: FilmIcon
		},
		{
			type: 'audio',
			name: 'Audio',
			content: { src: '', title: 'Audio' },
			icon: AudioLinesIcon
		},
		{
			type: 'whiteboard',
			name: 'Whiteboard',
			content: { data: '', width: 800, height: 600 },
			icon: PresentationIcon
		},
		{
			type: 'multiple_choice',
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
			type: 'fill_in_blank',
			name: 'Fill in the Blank',
			content: {
				sentence: 'Fill in the blank _____.',
				answer: 'Answer'
			},
			icon: PenToolIcon
		},
		{
			type: 'short_answer',
			name: 'Short Answer',
			content: {
				question: 'Question',
			},
			icon: PenToolIcon
		},
		{
			type: 'matching',
			name: 'Matching Pairs',
			content: {
				instructions: 'Match the items on the left with the correct answers on the right.',
				pairs: [
					{ left: 'Item 1', right: 'Answer 1' },
					{ left: 'Item 2', right: 'Answer 2' }
				]
			},
			icon: LinkIcon
		},
		{
			type: 'two_column_layout',
			name: 'Two Columns',
			content: {
				leftColumn: [],
				rightColumn: []
			},
			icon: ColumnsIcon
		}
	];
