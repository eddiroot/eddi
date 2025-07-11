/*eslint-disable @typescript-eslint/no-explicit-any */
import * as cheerio from 'cheerio';
import { db } from './db.js';
import {
	curriculum,
	curriculumSubject,
	learningArea,
	learningAreaContent,
	contentElaboration,
	yearLevelEnum
} from '../server/db/schema';
import { eq } from 'drizzle-orm';

interface ContentItem {
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
		console.log(`🔍 Fetching: ${url}`);
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

	private extractContentFromNextJS($: cheerio.CheerioAPI, subject: string): ContentItem[] {
		const contentItems: ContentItem[] = [];
		console.log('\n🎯 Extracting content from Next.js data...');

		// Find the Next.js data script
		const nextDataScript = $('script[id="__NEXT_DATA__"]');
		if (nextDataScript.length === 0) {
			console.log('❌ No Next.js data script found');
			return contentItems;
		}

		try {
			const jsonData = JSON.parse(nextDataScript.html() || '{}');
			console.log('✅ Found Next.js data script');

			const curriculumLevels = jsonData.props?.pageProps?.additionalContent?.curriculum?.curriculum;

			if (!curriculumLevels || !Array.isArray(curriculumLevels)) {
				console.log('❌ Could not find curriculum levels in Next.js data');
				return contentItems;
			}

			console.log(`📊 Found ${curriculumLevels.length} curriculum levels`);

			// Process each year level
			curriculumLevels.forEach((level: any) => {
				const yearLevel = this.mapLevelIdToYearLevel(level.id);
				console.log(`   🔍 Processing ${yearLevel} (${level.id})`);

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

									const contentItem: ContentItem = {
										learningArea: this.mapSubjectToLearningArea(subject),
										yearLevel: yearLevel,
										vcaaCode: desc.code,
										description: description,
										elaborations: elaborations,
										strand: strandName
									};

									contentItems.push(contentItem);
									console.log(
										`      ✅ ${desc.code}: ${description.substring(0, 50)}... (${elaborations.length} elaborations)`
									);
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

											const contentItem: ContentItem = {
												learningArea: this.mapSubjectToLearningArea(subject),
												yearLevel: yearLevel,
												vcaaCode: desc.code,
												description: description,
												elaborations: elaborations,
												strand: `${strandName} - ${subStrand.title || 'Sub-strand'}`
											};

											contentItems.push(contentItem);
											console.log(
												`      ✅ ${desc.code}: ${description.substring(0, 50)}... (${elaborations.length} elaborations)`
											);
										}
									});
								}
							});
						}
					});
				}
			});
		} catch (error) {
			console.error('❌ Failed to parse Next.js data:', error);
		}

		console.log(`📊 Extracted ${contentItems.length} content items from Next.js data`);
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

	private mapLevelIdToYearLevel(levelId: string): string {
		const mapping: { [key: string]: string } = {
			FLA: 'Foundation Level A',
			FLB: 'Foundation Level B',
			FLC: 'Foundation Level C',
			FLD: 'Foundation Level D',
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
			'10A': 'Year 10A'
		};

		return mapping[levelId] || levelId;
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
		console.log(`\n🎯 Scraping ${subject.toUpperCase()} curriculum...`);

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

			// @ts-expect-error Next.js data is not typed
			return this.extractContentFromNextJS($, subject);
		} catch (error) {
			console.error(`❌ Error scraping ${subject}:`, error);
			return [];
		}
	}

	/**
	 * Convert VCAA year level to individual year levels
	 */
	private parseYearLevel(yearLevel: string): string[] {
		// Normalize the input - remove "Year " prefix and extra spaces
		const normalized = yearLevel.replace(/^Year\s+/i, '').trim();

		// Handle Foundation year
		if (normalized.toLowerCase() === 'foundation') {
			return ['F'];
		}

		// Handle ranges like "9–10"
		if (normalized.includes('–')) {
			const [start, end] = normalized.split('–');
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

	async insertCurriculumData(contentItems: ContentItem[]): Promise<void> {
		console.log('\n💾 Inserting curriculum data into database...');

		for (const item of contentItems) {
			try {
				// Create or get curriculum
				let [curriculumRecord] = await db
					.select()
					.from(curriculum)
					.where(eq(curriculum.name, 'VCAA F-10 Curriculum'))
					.limit(1);

				if (!curriculumRecord) {
					[curriculumRecord] = await db
						.insert(curriculum)
						.values({
							name: 'VCAA F-10 Curriculum',
							version: '2.0'
						})
						.returning();
				}

				// Create or get curriculum subject
				let [subjectRecord] = await db
					.select()
					.from(curriculumSubject)
					.where(eq(curriculumSubject.name, item.learningArea))
					.limit(1);

				if (!subjectRecord) {
					[subjectRecord] = await db
						.insert(curriculumSubject)
						.values({
							curriculumId: curriculumRecord.id,
							name: item.learningArea
						})
						.returning();
				}

				// Create or get learning area (strand)
				let [learningAreaRecord] = await db
					.select()
					.from(learningArea)
					.where(eq(learningArea.name, item.strand))
					.limit(1);

				if (!learningAreaRecord) {
					[learningAreaRecord] = await db
						.insert(learningArea)
						.values({
							curriculumSubjectId: subjectRecord.id,
							name: item.strand,
							description: `${item.strand} strand for ${item.learningArea}`
						})
						.returning();
				}

				// Parse year levels (handle ranges like "9–10")
				const yearLevels = this.parseYearLevel(item.yearLevel);

				// Create learning area content for each year level
				for (const yl of yearLevels) {
					const [contentRecord] = await db
						.insert(learningAreaContent)
						.values({
							learningAreaId: learningAreaRecord.id,
							name: item.vcaaCode, // Use VCAA code as the name
							description: item.description,
							yearLevel: yl as yearLevelEnum
						})
						.returning();

					// Create content elaborations for this year level
					for (let i = 0; i < item.elaborations.length; i++) {
						const elaboration = item.elaborations[i];
						await db.insert(contentElaboration).values({
							learningAreaContentId: contentRecord.id,
							name: `Elaboration ${i + 1}`,
							contentElaboration: elaboration
						});
					}
				}

				console.log(
					`   ✅ Inserted: ${item.vcaaCode} with ${item.elaborations.length} elaborations`
				);
			} catch (error) {
				console.error(`   ❌ Error inserting ${item.vcaaCode}:`, error);
			}
		}
	}

	async scrapeAll(): Promise<void> {
		console.log('🚀 Starting VCAA F-10 curriculum scraping for ALL subjects...');

		const subjects = [
			// Core subjects (already working)
			'mathematics',
			'english',
			'science',

			// Technologies
			'design-and-technologies',
			'digital-technologies',

			// Humanities
			'civics-and-citizenship',
			'economics-and-business',
			'geography',
			'history',

			// Health & Physical Education
			'health-and-physical-education',

			// Languages (F-10 sequences)
			'chinese-f10',
			'french-f10',
			'german-f10',
			'indonesian-f10',
			'italian-f10',
			'japanese-f10',
			'korean-f10',
			'modern-greek-f10',
			'spanish-f10',

			// Languages (7-10 sequences)
			'chinese-710',
			'french-710',
			'german-710',
			'indonesian-710',
			'italian-710',
			'japanese-710',
			'korean-710',
			'modern-greek-710',
			'spanish-710',

			// The Arts
			'dance',
			'drama',
			'media-arts',
			'music',
			'visual-arts',
			'visual-communication-design'
		];

		console.log(`📋 Planning to scrape ${subjects.length} subjects...`);

		const allContentItems: ContentItem[] = [];

		for (const subject of subjects) {
			try {
				console.log(
					`\n📚 [${subjects.indexOf(subject) + 1}/${subjects.length}] Processing ${subject}...`
				);
				const items = await this.scrapeSubject(subject);
				allContentItems.push(...items);
				console.log(`   ✅ ${subject}: ${items.length} items extracted`);
			} catch (error) {
				console.error(`   ❌ Failed to scrape ${subject}:`, error);
			}
		}

		console.log(`\n📊 Total items extracted: ${allContentItems.length}`);

		if (allContentItems.length > 0) {
			await this.insertCurriculumData(allContentItems);
			console.log('✅ Scraping completed successfully for all subjects!');
		} else {
			console.log('⚠️  No content items were extracted');
		}
	}

	// Convenience methods for scraping specific subject groups
	async scrapeTechnologies(): Promise<void> {
		console.log('🔧 Scraping Technologies subjects...');
		const subjects = ['design-and-technologies', 'digital-technologies'];
		await this.scrapeSubjectGroup(subjects, 'Technologies');
	}

	async scrapeHumanities(): Promise<void> {
		console.log('🌍 Scraping Humanities subjects...');
		const subjects = ['civics-and-citizenship', 'economics-and-business', 'geography', 'history'];
		await this.scrapeSubjectGroup(subjects, 'Humanities');
	}

	async scrapeLanguages(): Promise<void> {
		console.log('🗣️ Scraping Languages subjects...');
		const subjects = [
			'chinese-f10',
			'chinese-710',
			'french-f10',
			'french-710',
			'german-f10',
			'german-710',
			'indonesian-f10',
			'indonesian-710',
			'italian-f10',
			'italian-710',
			'japanese-f10',
			'japanese-710',
			'korean-f10',
			'korean-710',
			'modern-greek-f10',
			'modern-greek-710',
			'spanish-f10',
			'spanish-710'
		];
		await this.scrapeSubjectGroup(subjects, 'Languages');
	}

	async scrapeArts(): Promise<void> {
		console.log('🎨 Scraping Arts subjects...');
		const subjects = [
			'dance',
			'drama',
			'media-arts',
			'music',
			'visual-arts',
			'visual-communication-design'
		];
		await this.scrapeSubjectGroup(subjects, 'Arts');
	}

	private async scrapeSubjectGroup(subjects: string[], groupName: string): Promise<void> {
		const allContentItems: ContentItem[] = [];

		for (const subject of subjects) {
			try {
				console.log(
					`\n📚 [${subjects.indexOf(subject) + 1}/${subjects.length}] Processing ${subject}...`
				);
				const items = await this.scrapeSubject(subject);
				allContentItems.push(...items);
				console.log(`   ✅ ${subject}: ${items.length} items extracted`);
			} catch (error) {
				console.error(`   ❌ Failed to scrape ${subject}:`, error);
			}
		}

		console.log(`\n📊 ${groupName} total: ${allContentItems.length} items extracted`);

		if (allContentItems.length > 0) {
			await this.insertCurriculumData(allContentItems);
			console.log(`✅ ${groupName} scraping completed successfully!`);
		}
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
