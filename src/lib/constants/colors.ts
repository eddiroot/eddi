export const TIMETABLE_COLOR_PALETTE = [
	{
		name: 'Soft Pink',
		background: '#FFE4E6',
		border: '#F8BBD9'
	},
	{
		name: 'Lavender',
		background: '#E8E4FF',
		border: '#C4B5FD'
	},
	{
		name: 'Mint Green',
		background: '#E0F7FA',
		border: '#B2DFDB'
	},
	{
		name: 'Peach',
		background: '#FFE8D6',
		border: '#FFCC9C'
	},
	{
		name: 'Sky Blue',
		background: '#E1F5FE',
		border: '#B3E5FC'
	},
	{
		name: 'Pale Yellow',
		background: '#FFF9C4',
		border: '#F9C74F'
	},
	{
		name: 'Light Coral',
		background: '#FFE5E5',
		border: '#FFB3BA'
	},
	{
		name: 'Sage Green',
		background: '#E8F5E8',
		border: '#C8E6C9'
	},
	{
		name: 'Powder Blue',
		background: '#E3F2FD',
		border: '#BBDEFB'
	},
	{
		name: 'Cream',
		background: '#FDF6E3',
		border: '#F5E6D3'
	},
	{
		name: 'Rose',
		background: '#FCE4EC',
		border: '#F8BBD9'
	},
	{
		name: 'Soft Purple',
		background: '#F3E5F5',
		border: '#E1BEE7'
	},
	{
		name: 'Soft Red',
		background: '#FFEBEE',
		border: '#FFCDD2'
	},
	{
		name: 'Peach Orange',
		background: '#FFF3E0',
		border: '#FFCC80'
	},
	{
		name: 'Soft Teal',
		background: '#E0F2F1',
		border: '#B2DFDB'
	},
	{
		name: 'Light Amber',
		background: '#FFF8E1',
		border: '#FFE082'
	},
	{
		name: 'Soft Indigo',
		background: '#E8EAF6',
		border: '#C5CAE9'
	}
] as const;

// Type for accessing color data
export type TimetableColor = (typeof TIMETABLE_COLOR_PALETTE)[number];

// Helper function to get a color by index (with cycling)
export const getTimetableColor = (index: number): TimetableColor => {
	return TIMETABLE_COLOR_PALETTE[index % TIMETABLE_COLOR_PALETTE.length];
};

// Helper function to get color by subject name (consistent coloring)
export const getTimetableColorBySubject = (subjectName: string): TimetableColor => {
	// Create a simple hash from the subject name for consistent color assignment
	const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return getTimetableColor(hash);
};
