import { db } from '$lib/server/db';
import { fetActivity } from '$lib/server/db/schema';
import { XMLParser } from 'fast-xml-parser';

interface ActivityXML {
	Activities_Timetable: {
		Activity: Array<{
			Id: string;
			Day: string;
			Hour: string;
			Room: string;
		}>;
	};
}

interface FETXML {
	fet: {
		Activities_List: {
			Activity: Array<{
				Id: string;
				Teacher: string;
				Subject: string;
				Students: string;
				Duration: string;
			}>;
		};
	};
}

interface FETActivityRecord {
	id: number;
	timetableId: number;
	teacherId: string;
	subjectId: number;
	groupId: number;
	spaceId: number;
	day: number;
	period: number;
	duration: number;
}

export class FETActivityParser {
	private xmlParser: XMLParser;

	constructor() {
		this.xmlParser = new XMLParser({
			ignoreAttributes: false,
			parseAttributeValue: false,
			parseTagValue: true,
			trimValues: true
		});
	}

	/**
	 * Parse both XML files and return structured activity data
	 */
	async parseFiles(
		activitiesXmlContent: string,
		fetXmlContent: string,
		timetableId: number
	): Promise<FETActivityRecord[]> {
		try {
			// Parse the activities timetable XML
			const activitiesData: ActivityXML = this.xmlParser.parse(activitiesXmlContent);
			const activities = activitiesData.Activities_Timetable.Activity;

			// Parse the FET configuration XML
			const fetData: FETXML = this.xmlParser.parse(fetXmlContent);
			const fetActivities = fetData.fet.Activities_List.Activity;

			// Create a map of activity ID to FET activity details
			const fetActivityMap = new Map<string, (typeof fetActivities)[0]>();
			fetActivities.forEach((activity) => {
				fetActivityMap.set(activity.Id, activity);
			});

			// Combine the data
			const combinedActivities: FETActivityRecord[] = [];

			for (const activity of activities) {
				const fetActivity = fetActivityMap.get(activity.Id);

				if (!fetActivity) {
					console.warn(`FET activity not found for ID: ${activity.Id}`);
					continue;
				}

				// Handle the case where Room might be empty
				const spaceId = activity.Room ? parseInt(activity.Room) : 0;

				const record: FETActivityRecord = {
					id: parseInt(activity.Id),
					timetableId: timetableId,
					teacherId: fetActivity.Teacher,
					subjectId: parseInt(fetActivity.Subject),
					groupId: parseInt(fetActivity.Students),
					spaceId: spaceId,
					day: parseInt(activity.Day),
					period: parseInt(activity.Hour),
					duration: parseInt(fetActivity.Duration)
				};

				combinedActivities.push(record);
			}

			return combinedActivities;
		} catch (error: unknown) {
			console.error('Error parsing XML files:', error);
			throw error;
		}
	}

	/**
	 * Insert parsed activities into the database
	 */
	async insertActivities(activities: FETActivityRecord[]): Promise<void> {
		try {
			// Insert in batches to handle large datasets efficiently
			const batchSize = 100;

			for (let i = 0; i < activities.length; i += batchSize) {
				const batch = activities.slice(i, i + batchSize);

				await db.insert(fetActivity).values(batch);

				console.log(
					`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(activities.length / batchSize)}`
				);
			}

			console.log(`Successfully inserted ${activities.length} activities`);
		} catch (error) {
			console.error('Error inserting activities:', error);
		}
	}

	/**
	 * Main method to parse files and populate database
	 */
	async parseAndPopulate(
		activitiesXmlContent: string,
		fetXmlContent: string,
		timetableId: number
	): Promise<void> {
		try {
			console.log('Parsing XML files...');
			const activities = await this.parseFiles(activitiesXmlContent, fetXmlContent, timetableId);

			console.log(`Parsed ${activities.length} activities`);

			console.log('Inserting activities into database...');
			await this.insertActivities(activities);

			console.log('Process completed successfully!');
		} catch (error) {
			console.error('Error in parseAndPopulate:', error);
			throw error;
		}
	}

	/**
	 * Validate parsed data before insertion
	 */
	validateActivity(activity: FETActivityRecord): boolean {
		// Additional validation rules
		if (activity.duration <= 0) {
			console.warn(`Invalid duration ${activity.duration} for activity ${activity.id}`);
			return false;
		}

		if (activity.day < 1000 || activity.day > 1004) {
			console.warn(`Invalid day ${activity.day} for activity ${activity.id}`);
			return false;
		}

		if (activity.period < 1000 || activity.period > 1005) {
			console.warn(`Invalid period ${activity.period} for activity ${activity.id}`);
			return false;
		}

		return true;
	}

	/**
	 * Parse and populate with validation
	 */
	async parseAndPopulateWithValidation(
		activitiesXmlContent: string,
		fetXmlContent: string,
		timetableId: number
	): Promise<void> {
		try {
			console.log('Parsing XML files with validation...');
			const activities = await this.parseFiles(activitiesXmlContent, fetXmlContent, timetableId);

			// Filter valid activities
			const validActivities = activities.filter((activity) => this.validateActivity(activity));

			console.log(`Parsed ${activities.length} activities, ${validActivities.length} valid`);

			if (validActivities.length === 0) {
				throw new Error('No valid activities found to insert');
			}

			console.log('Inserting valid activities into database...');
			await this.insertActivities(validActivities);

			console.log('Process completed successfully!');
		} catch (error) {
			console.error('Error in parseAndPopulateWithValidation:', error);
			throw error;
		}
	}
}

// Usage example:
export async function processFETFiles(
	activitiesXmlPath: string,
	fetXmlPath: string,
	timetableId: number
): Promise<void> {
	const fs = await import('fs/promises');

	try {
		// Read the XML files
		const activitiesXmlContent = await fs.readFile(activitiesXmlPath, 'utf-8');
		const fetXmlContent = await fs.readFile(fetXmlPath, 'utf-8');

		// Create parser instance and process
		const parser = new FETActivityParser();
		await parser.parseAndPopulateWithValidation(activitiesXmlContent, fetXmlContent, timetableId);
	} catch (error) {
		console.error('Failed to process FET files:', error);
		throw error;
	}
}

// Alternative usage with direct content:
export async function processFETContent(
	activitiesXmlContent: string,
	fetXmlContent: string,
	timetableId: number
): Promise<void> {
	const parser = new FETActivityParser();
	await parser.parseAndPopulateWithValidation(activitiesXmlContent, fetXmlContent, timetableId);
}
