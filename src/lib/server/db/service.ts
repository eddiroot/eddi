import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { desc, eq } from 'drizzle-orm';

export async function getSubjectsByUserId(userId: string) {
	const subjects = await db
		.select({ subject: table.subject })
		.from(table.userSubject)
		.innerJoin(table.subject, eq(table.subject.id, table.userSubject.subjectId))
		.where(eq(table.userSubject.userId, userId));

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

export async function getSubjectThreadsMinimalBySubjectId(subjectId: number) {
	const threads = await db
		.select({
			thread: {
				id: table.subjectThread.id,
				title: table.subjectThread.title,
				createdAt: table.subjectThread.createdAt
			},
			user: {
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			}
		})
		.from(table.subjectThread)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.subjectThread.subjectId, subjectId))
		.orderBy(desc(table.subjectThread.createdAt));

	return threads;
}

export async function getSubjectThreadById(threadId: number) {
	const threads = await db
		.select({
			thread: table.subjectThread,
			user: {
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			}
		})
		.from(table.subjectThread)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.subjectThread.id, threadId))
		.limit(1);

	if (threads.length === 0) {
		return null;
	}

	return threads[0];
}

export async function createSubjectThread(
	type: string,
	subjectId: number,
	userId: string,
	title: string,
	content: string
) {
	const [thread] = await db
		.insert(table.subjectThread)
		.values({
			type,
			subjectId,
			userId,
			title,
			content
		})
		.returning();

	return thread;
}
