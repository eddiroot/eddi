import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { randomInt } from 'crypto';

export async function createUser({
	email,
	password,
	schoolId,
	type,
	firstName,
	lastName,
	gender,
	dateOfBirth,
	honorific,
	yearLevel,
	middleName,
	avatarUrl,
	isArchived = false
}: {
	email: string;
	password: string;
	schoolId: number;
	type: table.userTypeEnum;
	firstName: string;
	lastName: string;
	gender?: table.userGenderEnum;
	dateOfBirth?: Date;
	honorific?: table.userHonorificEnum;
	yearLevel: table.yearLevelEnum;
	middleName?: string;
	avatarUrl?: string;
	isArchived?: boolean;
}) {
	const passwordHash = await hash(password);
	const verificationCode = String(randomInt(100000, 1000000));

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
			yearLevel,
			middleName,
			avatarUrl,
			verificationCode,
			isArchived
		})
		.returning();

	return { user, verificationCode };
}

export async function updateUserVerificationCode(userId: string, verificationCode: string) {
	await db.update(table.user).set({ verificationCode }).where(eq(table.user.id, userId));
}

export async function getUserById(userId: string) {
	const [user] = await db.select().from(table.user).where(eq(table.user.id, userId));
	return user;
}

export async function setUserVerified(userId: string) {
	await db
		.update(table.user)
		.set({ emailVerified: true, verificationCode: null })
		.where(eq(table.user.id, userId));
}

export async function checkUserExistence(email: string): Promise<boolean> {
	const users = await db.select().from(table.user).where(eq(table.user.email, email)).limit(1);
	return users.length > 0;
}

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

export async function getGuardiansForStudent(studentUserId: string) {
	const guardians = await db
		.select({
			guardian: {
				id: table.user.id,
				email: table.user.email,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName
			},
			relationshipType: table.userRelationship.relationshipType
		})
		.from(table.userRelationship)
		.innerJoin(table.user, eq(table.user.id, table.userRelationship.relatedUserId))
		.where(
			and(
				eq(table.userRelationship.userId, studentUserId),
				eq(table.user.type, table.userTypeEnum.guardian)
			)
		);

	return guardians;
}
