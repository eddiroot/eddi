import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

export async function verifyUserAccessToClass(
	userId: string,
	subjectOfferingClassId: number
): Promise<boolean> {
	const userAccess = await db
		.select()
		.from(table.userSubjectOfferingClass)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				eq(table.userSubjectOfferingClass.subOffClassId, subjectOfferingClassId),
				eq(table.userSubjectOfferingClass.isArchived, false)
			)
		)
		.limit(1);
	return userAccess.length > 0;
}

export async function verifyUserAccessToSubjectOffering(
	userId: string,
	subjectOfferingId: number
): Promise<boolean> {
	const userAccess = await db
		.select()
		.from(table.userSubjectOffering)
		.where(
			and(
				eq(table.userSubjectOffering.userId, userId),
				eq(table.userSubjectOffering.subOfferingId, subjectOfferingId),
				eq(table.userSubjectOffering.isArchived, 0)
			)
		)
		.limit(1);
	return userAccess.length > 0;
}

export async function createUser(
	email: string,
	passwordHash: string,
	schoolId: number,
	type: table.userTypeEnum,
	firstName: string,
	lastName: string,
	gender?: table.userGenderEnum,
	dateOfBirth?: Date,
	honorific?: table.userHonorificEnum,
	middleName?: string,
	avatarUrl?: string,
	isArchived?: boolean
) {
	const [user] = await db
		.insert(table.user)
		.values({
			email,
			passwordHash,
			schoolId,
			type,
			firstName,
			lastName,
			gender,
			dateOfBirth,
			honorific,
			middleName,
			avatarUrl,
			isArchived
		})
		.returning();

	return user;
}
