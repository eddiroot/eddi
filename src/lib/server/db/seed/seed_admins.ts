import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import postgres from 'postgres';
import { hash } from '@node-rs/argon2';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export async function seed_admins() {
	const passwordHash = await hash('admin');

	const admins = await db
		.insert(schema.user)
		.values([
			{
				id: 'admin_001',
				email: 'isaac.newton@schoolofeddi.edu',
				passwordHash: passwordHash,
				schoolId: 1000,
				type: schema.userTypeEnum.schoolAdmin,
				gender: schema.userGenderEnum.male,
				dateOfBirth: new Date('1980-03-11'),
				honorific: schema.userHonorificEnum.mr,
				firstName: 'Isaac',
				lastName: 'Newton'
			}
		])
		.returning();

	console.log('Seeded admins:', admins.length, 'admin users');

	return { admins };
}
