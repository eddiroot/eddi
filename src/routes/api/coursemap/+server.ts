import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import {
	getCourseMapItemLearningAreas,
	getCoursemapItemAssessmentPlans,
	getLearningAreaContentByLearningAreaId
} from '$lib/server/db/service/coursemap';
import { yearLevelEnum } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ url }) => {
	const action = url.searchParams.get('action');

	switch (action) {
		case 'learning-areas': {
			const courseMapItemId = parseInt(url.searchParams.get('courseMapItemId') || '');

			if (isNaN(courseMapItemId)) {
				return json({ error: 'Invalid course map item ID' }, { status: 400 });
			}

			try {
				const learningAreas = await getCourseMapItemLearningAreas(courseMapItemId);
				return json(learningAreas);
			} catch (error) {
				console.error('Error fetching learning areas:', error);
				return json({ error: 'Failed to fetch learning areas' }, { status: 500 });
			}
		}

		case 'assessment-plans': {
			const courseMapItemId = parseInt(url.searchParams.get('courseMapItemId') || '');

			if (isNaN(courseMapItemId)) {
				return json({ error: 'Invalid course map item ID' }, { status: 400 });
			}

			try {
				const assessmentPlans = await getCoursemapItemAssessmentPlans(courseMapItemId);
				return json(assessmentPlans);
			} catch (error) {
				console.error('Error fetching assessment plans:', error);
				return json({ error: 'Failed to fetch assessment plans' }, { status: 500 });
			}
		}

		case 'learning-area-content': {
			const learningAreaId = parseInt(url.searchParams.get('learningAreaId') || '');
			const yearLevelParam = url.searchParams.get('yearLevel') || 'year9';

			if (isNaN(learningAreaId)) {
				return json({ error: 'Invalid learning area ID' }, { status: 400 });
			}

			// Convert year level string to enum
			let yearLevel: keyof typeof yearLevelEnum;
			switch (yearLevelParam.toLowerCase()) {
				case 'foundation':
					yearLevel = 'foundation';
					break;
				case 'year1':
				case 'year 1':
					yearLevel = 'year1';
					break;
				case 'year2':
				case 'year 2':
					yearLevel = 'year2';
					break;
				case 'year3':
				case 'year 3':
					yearLevel = 'year3';
					break;
				case 'year4':
				case 'year 4':
					yearLevel = 'year4';
					break;
				case 'year5':
				case 'year 5':
					yearLevel = 'year5';
					break;
				case 'year6':
				case 'year 6':
					yearLevel = 'year6';
					break;
				case 'year7':
				case 'year 7':
					yearLevel = 'year7';
					break;
				case 'year8':
				case 'year 8':
					yearLevel = 'year8';
					break;
				case 'year9':
				case 'year 9':
					yearLevel = 'year9';
					break;
				case 'year10':
				case 'year 10':
					yearLevel = 'year10';
					break;
				default:
					yearLevel = 'year9';
					break;
			}

			try {
				const contentResult = await getLearningAreaContentByLearningAreaId(
					learningAreaId,
					yearLevelEnum[yearLevel]
				);
				const content = contentResult.map((item) => item.learningAreaContent);
				return json(content);
			} catch (error) {
				console.error('Error fetching learning area content:', error);
				return json({ error: 'Failed to fetch learning area content' }, { status: 500 });
			}
		}

		default:
			return json({ error: 'Invalid action parameter' }, { status: 400 });
	}
};
