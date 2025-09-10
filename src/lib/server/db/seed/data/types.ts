export interface VCAACurriculumData {
	scrapedAt: string;
	subjects: VCAASubject[];
}

export interface VCAASubject {
	name: string;
	url: string;
	learningAreas: VCAALearningArea[];
}

export interface VCAALearningArea {
	name: string;
	description: string;
	standards: VCAAStandard[];
}

export interface VCAAStandard {
	name: string;
	description: string;
	yearLevel: string;
	elaborations: string[];
}
