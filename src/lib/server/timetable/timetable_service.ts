import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, asc } from 'drizzle-orm';

export async function getPossibleSubjectOfferingsForTeacher(teacherId: string) {
	const result = await db
		.select({
			subjectOffering: table.subjectOffering
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.userSubjectOffering.subOfferingId, table.subjectOffering.id)
		)
		.where(eq(table.userSubjectOffering.userId, teacherId))
		.orderBy(asc(table.subjectOffering.year), asc(table.subjectOffering.semester));

	return result;
}
