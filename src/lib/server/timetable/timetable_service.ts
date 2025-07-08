import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq, and, gte, inArray, asc, sql, count } from 'drizzle-orm';

export async function getPossibleSubjectOfferingsForTeacher(teacherId: string) {
	const result = await db
		.select({
			subjectOffering: table.subjectOffering
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.userSubjectOffering.subjectOfferingId, table.subjectOffering.id)
		)
		.where(eq(table.userSubjectOffering.userId, teacherId))
		.orderBy(asc(table.subjectOffering.year), asc(table.subjectOffering.semester));

	return result;
}
