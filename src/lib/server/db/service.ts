import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq } from 'drizzle-orm';

export async function getSubjectsByUserId(userId: string) {
	const subjects = await db
		.select({ subject: table.subject })
		.from(table.userSubject)
		.innerJoin(table.subject, eq(table.subject.id, table.userSubject.subjectId))
		.where(eq(table.userSubject.userId, userId));

	//TODO: Remove the need for this mapping call
	return subjects.map((row) => row.subject);
}

export async function getSubjectById(subjectId: number) {
	const subject = await db
		.select({ subject: table.subject })
		.from(table.subject)
		.where(eq(table.subject.id, subjectId))
		.limit(1);

	return subject[0]?.subject;
}

export async function getSubjectThreadsBySubjectId(subjectId: number) {
	const threads = await db
		.select({ thread: table.subjectThread })
		.from(table.subjectThread)
		.where(eq(table.subjectThread.subjectId, subjectId))
		.orderBy(desc(table.subjectThread.createdAt));

	return threads.map((row) => row.thread);
}
