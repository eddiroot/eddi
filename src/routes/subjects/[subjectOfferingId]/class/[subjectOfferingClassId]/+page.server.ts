// need to change over to ussing subjectOffering class instead

import {
	getSubjectBySubjectOfferingClassId,
	getClassById,
	getTeachersBySubjectOfferingClassId,
	getAssessmentsBySubjectOfferingClassId,
	getResourcesBySubjectOfferingClassId,
	getAnnouncementsBySubjectOfferingClassId,
	getLessonsAndHomeworkBySubjectOfferingClassId
} from '$lib/server/db/service';
import { getPresignedUrl } from '$lib/server/obj';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	security.isAuthenticated();
	const user = security.isAuthenticated().getUser();
	const thisSubjectOffering = await getSubjectBySubjectOfferingClassId(Number(subjectOfferingClassId));
	const thisSubjectOfferingClass = await getClassById(Number(subjectOfferingClassId));
	const thisSubjectOfferingTeachers = await getTeachersBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);
	const assessments = await getAssessmentsBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);
	const tasks = await getLessonsAndHomeworkBySubjectOfferingClassId(
		user.id,
		Number(subjectOfferingClassId)
	);
	const resources = await getResourcesBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);
	const announcements = await getAnnouncementsBySubjectOfferingClassId(
		Number(subjectOfferingClassId)
	);

	// Generate presigned URLs for each resource
	const resourcesWithUrls = await Promise.all(
		resources.map(async (row) => {
			try {
				const schoolId = user.schoolId.toString();
				// Strip schoolId prefix if it exists to avoid double-prefixing
				const objectName = row.resource.objectKey.startsWith(schoolId)
					? row.resource.objectKey.substring(schoolId.length + 1)
					: row.resource.objectKey;

				const downloadUrl = await getPresignedUrl(
					schoolId,
					objectName,
					7 * 24 * 60 * 60 // 7 days expiry
				);
				return {
					...row,
					downloadUrl
				};
			} catch (error) {
				console.error(`Failed to generate URL for resource ${row.resource.id}:`, error);
				return {
					...row,
					downloadUrl: null
				};
			}
		})
	);

	return { user, thisSubjectOffering, thisSubjectOfferingClass, thisSubjectOfferingTeachers, assessments, tasks, resources: resourcesWithUrls, announcements };
};
