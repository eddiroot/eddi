import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export async function getSubjectsByUserId(userId: string) {
	const subjects = await db
		.select({ subject: table.subject })
		.from(table.userSubject)
		.innerJoin(table.subject, eq(table.subject.id, table.userSubject.subjectId))
		.where(eq(table.userSubject.userId, userId));

	return subjects;
}
