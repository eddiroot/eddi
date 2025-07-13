/*eslint-disable @typescript-eslint/no-explicit-any */
import * as cheerio from 'cheerio';

export interface ContentItem {
	learningArea: string;
	yearLevel: string;
	vcaaCode: string;
	description: string;
	elaborations: string[];
	strand: string;
}

export class VCAAF10Scraper {
	private baseUrl = 'https://f10.vcaa.vic.edu.au';
	private delayBetweenRequests = 2000;

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async fetchPage(url: string): Promise<string> {
		await this.delay(this.delayBetweenRequests);

		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				'Accept-Encoding': 'gzip, deflate, br',
				Connection: 'keep-alive',
				'Upgrade-Insecure-Requests': '1'
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
		}
		return response.text();
	}

	private extractContentFromNextJS($: any, subject: string): ContentItem[] {
		const contentItems: ContentItem[] = [];

		// Find the Next.js data script
		const nextDataScript = $('script[id="__NEXT_DATA__"]');
		if (nextDataScript.length === 0) {
			return contentItems;
		}

		try {
			const jsonData = JSON.parse(nextDataScript.html() || '{}');

			const curriculumLevels = jsonData.props?.pageProps?.additionalContent?.curriculum?.curriculum;

			if (!curriculumLevels || !Array.isArray(curriculumLevels)) {
				return contentItems;
			}

			// Process each year level
			curriculumLevels.forEach((level: any) => {
				const yearLevels = this.mapLevelIdToYearLevel(level.id);

				if (level.contentDescriptionsContent && Array.isArray(level.contentDescriptionsContent)) {
					// Process each strand
					level.contentDescriptionsContent.forEach((strand: any) => {
						const strandName = strand.title || 'General';

						if (strand.contentDescriptions && Array.isArray(strand.contentDescriptions)) {
							// Process each content description
							strand.contentDescriptions.forEach((desc: any) => {
								// Handle both 'description' and 'contentDescription' fields
								const rawDescription = desc.description || desc.contentDescription;

								if (desc.code && rawDescription) {
									// Clean HTML from description
									const description = this.stripHtmlTags(rawDescription);
									const elaborations = this.extractElaborations(desc.elaborations);

									// Create content items for each year level in the range
									yearLevels.forEach((yearLevel) => {
										const contentItem: ContentItem = {
											learningArea: strandName, // Use strand as learning area (e.g., "Number and Algebra")
											yearLevel: yearLevel,
											vcaaCode: desc.code,
											description: description,
											elaborations: elaborations,
											strand: this.mapSubjectToLearningArea(subject) // Use subject as strand (e.g., "Mathematics")
										};

										contentItems.push(contentItem);
									});
								}
							});
						}

						// Also process sub-strands if they exist
						if (strand.subStrands && Array.isArray(strand.subStrands)) {
							strand.subStrands.forEach((subStrand: any) => {
								if (subStrand.contentDescriptions && Array.isArray(subStrand.contentDescriptions)) {
									subStrand.contentDescriptions.forEach((desc: any) => {
										// Handle both 'description' and 'contentDescription' fields
										const rawDescription = desc.description || desc.contentDescription;

										if (desc.code && rawDescription) {
											// Clean HTML from description
											const description = this.stripHtmlTags(rawDescription);
											const elaborations = this.extractElaborations(desc.elaborations);

											// Create content items for each year level in the range
											yearLevels.forEach((yearLevel) => {
												const contentItem: ContentItem = {
													learningArea: `${strandName} - ${subStrand.title || 'Sub-strand'}`, // Use combined strand/substrand as learning area
													yearLevel: yearLevel,
													vcaaCode: desc.code,
													description: description,
													elaborations: elaborations,
													strand: this.mapSubjectToLearningArea(subject) // Use subject as strand
												};

												contentItems.push(contentItem);
											});
										}
									});
								}
							});
						}
					});
				}
			});
		} catch {
			// Silently handle errors
		}

		return contentItems;
	}

	private extractElaborations(elaborationsArray: any[]): string[] {
		if (!Array.isArray(elaborationsArray)) {
			return [];
		}

		return elaborationsArray
			.map((elab) => {
				let text = '';
				if (typeof elab === 'string') {
					text = elab;
				} else if (elab && elab.elaborationText) {
					text = elab.elaborationText;
				} else {
					return null;
				}

				// Strip HTML tags and clean up the text
				return this.stripHtmlTags(text);
			})
			.filter((text) => text && text.length > 0) as string[];
	}

	private mapLevelIdToYearLevel(levelId: string): string[] {
		// Handle ranges and return all year levels in the range
		const rangeMapping: { [key: string]: string[] } = {
			'F-2': ['Foundation', 'Year 1', 'Year 2'],
			'F–2': ['Foundation', 'Year 1', 'Year 2'],
			'1–2': ['Year 1', 'Year 2'],
			'1-2': ['Year 1', 'Year 2'],
			'3-4': ['Year 3', 'Year 4'],
			'3–4': ['Year 3', 'Year 4'],
			'5–6': ['Year 5', 'Year 6'],
			'5-6': ['Year 5', 'Year 6'],
			'7–8': ['Year 7', 'Year 8'],
			'7-8': ['Year 7', 'Year 8'],
			'9–10': ['Year 9', 'Year 10'],
			'9-10': ['Year 9', 'Year 10']
		};

		// Check if it's a range first
		if (rangeMapping[levelId]) {
			return rangeMapping[levelId];
		}

		// Handle individual year levels
		const singleMapping: { [key: string]: string } = {
			FLA: 'Foundation',
			FLB: 'Foundation',
			FLC: 'Foundation',
			FLD: 'Foundation',
			F: 'Foundation',
			'1': 'Year 1',
			'2': 'Year 2',
			'3': 'Year 3',
			'4': 'Year 4',
			'5': 'Year 5',
			'6': 'Year 6',
			'7': 'Year 7',
			'8': 'Year 8',
			'9': 'Year 9',
			'10': 'Year 10',
			'10A': 'Year 10'
		};

		const mapped = singleMapping[levelId] || levelId;
		return [mapped];
	}

	private mapSubjectToLearningArea(subject: string): string {
		const mapping: { [key: string]: string } = {
			// Core subjects
			mathematics: 'Mathematics',
			english: 'English',
			science: 'Science',

			// Technologies - use individual names
			'design-and-technologies': 'Design and Technologies',
			'digital-technologies': 'Digital Technologies',

			// Humanities - keep together
			'civics-and-citizenship': 'Humanities',
			'economics-and-business': 'Humanities',
			geography: 'Humanities',
			history: 'Humanities',

			// Health & Physical Education
			'health-and-physical-education': 'Health and Physical Education',

			// Languages - use individual names
			chinese: 'Chinese',
			'chinese-f10': 'Chinese',
			'chinese-710': 'Chinese',
			french: 'French',
			'french-f10': 'French',
			'french-710': 'French',
			german: 'German',
			'german-f10': 'German',
			'german-710': 'German',
			indonesian: 'Indonesian',
			'indonesian-f10': 'Indonesian',
			'indonesian-710': 'Indonesian',
			italian: 'Italian',
			'italian-f10': 'Italian',
			'italian-710': 'Italian',
			japanese: 'Japanese',
			'japanese-f10': 'Japanese',
			'japanese-710': 'Japanese',
			korean: 'Korean',
			'korean-f10': 'Korean',
			'korean-710': 'Korean',
			'modern-greek': 'Modern Greek',
			'modern-greek-f10': 'Modern Greek',
			'modern-greek-710': 'Modern Greek',
			spanish: 'Spanish',
			'spanish-f10': 'Spanish',
			'spanish-710': 'Spanish',

			// Arts - use individual names
			dance: 'Dance',
			drama: 'Drama',
			'media-arts': 'Media Arts',
			music: 'Music',
			'visual-arts': 'Visual Arts',
			'visual-communication-design': 'Visual Communication Design'
		};

		return mapping[subject.toLowerCase()] || 'General';
	}

	async scrapeSubject(subject: string): Promise<ContentItem[]> {
		// Define URL patterns for all subjects
		const urlPatterns: { [key: string]: string } = {
			// Core subjects
			mathematics: '/learning-areas/mathematics/curriculum',
			english: '/learning-areas/english/english/curriculum',
			science: '/learning-areas/science/curriculum',

			// Technologies
			'design-and-technologies': '/learning-areas/technologies/design-and-technologies/curriculum',
			'digital-technologies': '/learning-areas/technologies/digital-technologies/curriculum',

			// Humanities
			'civics-and-citizenship': '/learning-areas/humanities/civics-and-citizenship/curriculum',
			'economics-and-business': '/learning-areas/humanities/economics-and-business/curriculum',
			geography: '/learning-areas/humanities/geography/curriculum',
			history: '/learning-areas/humanities/history/curriculum',

			// Health & Physical Education
			'health-and-physical-education': '/learning-areas/health-and-physical-education/curriculum',

			// Languages (F-10 sequences)
			'chinese-f10': '/learning-areas/languages/chinese/second-language-learner-f-10-sequence',
			'chinese-710': '/learning-areas/languages/chinese/second-language-learner-7-10-sequence',
			'french-f10': '/learning-areas/languages/french/curriculum-f-10-sequence',
			'french-710': '/learning-areas/languages/french/curriculum-7-10-sequence',
			'german-f10': '/learning-areas/languages/german/curriculum-f-10-sequence',
			'german-710': '/learning-areas/languages/german/curriculum-7-10-sequence',
			'indonesian-f10': '/learning-areas/languages/indonesian/curriculum-f-10-sequence',
			'indonesian-710': '/learning-areas/languages/indonesian/curriculum-7-10-sequence',
			'italian-f10': '/learning-areas/languages/italian/curriculum-f-10-sequence',
			'italian-710': '/learning-areas/languages/italian/curriculum-7-10-sequence',
			'japanese-f10': '/learning-areas/languages/japanese/curriculum-f-10-sequence',
			'japanese-710': '/learning-areas/languages/japanese/curriculum-7-10-sequence',
			'korean-f10': '/learning-areas/languages/korean/curriculum-f-10-sequence',
			'korean-710': '/learning-areas/languages/korean/curriculum-7-10-sequence',
			'modern-greek-f10': '/learning-areas/languages/modern-greek/curriculum-f-10-sequence',
			'modern-greek-710': '/learning-areas/languages/modern-greek/curriculum-7-10-sequence',
			'spanish-f10': '/learning-areas/languages/spanish/curriculum-f-10-sequence',
			'spanish-710': '/learning-areas/languages/spanish/curriculum-7-10-sequence',

			// The Arts
			dance: '/learning-areas/the-arts/dance/curriculum',
			drama: '/learning-areas/the-arts/drama/curriculum',
			'media-arts': '/learning-areas/the-arts/media-arts/curriculum',
			music: '/learning-areas/the-arts/music/curriculum',
			'visual-arts': '/learning-areas/the-arts/visual-arts/curriculum',
			'visual-communication-design':
				'/learning-areas/the-arts/visual-communication-design/curriculum'
		};

		const urlPath = urlPatterns[subject.toLowerCase()];
		if (!urlPath) {
			throw new Error(
				`Unknown subject: ${subject}. Available subjects: ${Object.keys(urlPatterns).join(', ')}`
			);
		}

		const url = `${this.baseUrl}${urlPath}`;

		try {
			const html = await this.fetchPage(url);
			const $ = cheerio.load(html);

			return this.extractContentFromNextJS($, subject);
		} catch {
			return [];
		}
	}

	/**
	 * Convert VCAA year level to individual year levels
	 */
	parseYearLevel(yearLevel: string): string[] {
		// Normalize the input - remove "Year " prefix and extra spaces
		const normalized = yearLevel.replace(/^Year\s+/i, '').trim();

		// Handle Foundation year
		if (normalized.toLowerCase() === 'foundation') {
			return ['F'];
		}

		// Handle ranges like "9–10"
		if (normalized.includes('–') || normalized.includes('-')) {
			const separator = normalized.includes('–') ? '–' : '-';
			const [start, end] = normalized.split(separator);

			// Handle Foundation ranges like "F-2"
			if (start.toLowerCase() === 'f') {
				const result = ['F'];
				const endNum = parseInt(end);
				for (let i = 1; i <= endNum; i++) {
					result.push(i.toString());
				}
				return result;
			}

			// Handle numeric ranges
			const startNum = parseInt(start);
			const endNum = parseInt(end);
			const result = [];
			for (let i = startNum; i <= endNum; i++) {
				result.push(i.toString());
			}
			return result;
		}

		// Handle individual year levels
		return [normalized];
	}

	/**
	 * Scrape core subjects for F-10 curriculum
	 */
	async scrapeCoreSubjects(): Promise<ContentItem[]> {
		const coreSubjects = ['mathematics', 'english', 'science', 'health-and-physical-education'];
		const allContentItems: ContentItem[] = [];

		for (const subject of coreSubjects) {
			try {
				const items = await this.scrapeSubject(subject);
				allContentItems.push(...items);
			} catch {
				// Silently handle errors for individual subjects
			}
		}

		return allContentItems;
	}

	private stripHtmlTags(text: string): string {
		// Remove HTML tags and decode HTML entities
		return text
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
			.replace(/&amp;/g, '&') // Replace HTML entities
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, ' ') // Replace multiple whitespace with single space
			.trim(); // Remove leading/trailing whitespace
	}
}
