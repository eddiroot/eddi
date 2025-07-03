import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import * as schema from '../schema';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export async function seed_school() {
	await reset(db, schema);
	const [school] = await db
		.insert(schema.school)
		.values([
			{
				name: 'School of Eddi'
			}
		])
		.returning();

	console.log('Seeded school:', school);

	// Seed campuses
	const campuses = await db
		.insert(schema.campus)
		.values([
			{
				schoolId: school.id,
				name: 'North Campus',
				address: '123 Eddi Street, Eddi Town, ED 1234',
				description: 'Primary campus with most academic facilities'
			},
			{
				schoolId: school.id,
				name: 'South Campus',
				address: '456 Athletic Avenue, Eddi Town, ED 1235',
				description: 'Secondary campus focused on sports and physical activities'
			}
		])
		.returning();

	console.log('Seeded campuses:', campuses.length, 'campuses');

	// Seed school locations for North Campus
	const northCampusLocations = await db
		.insert(schema.schoolLocation)
		.values([
			{
				campusId: campuses[0].id,
				name: 'Room 101',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 30,
				description: 'Standard classroom with whiteboard and projector'
			},
			{
				campusId: campuses[0].id,
				name: 'Room 102',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 28,
				description: 'Classroom with interactive smart board'
			},
			{
				campusId: campuses[0].id,
				name: 'Science Lab A',
				type: schema.schoolLocationTypeEnum.laboratory,
				capacity: 24,
				description: 'Chemistry and biology laboratory with safety equipment'
			},
			{
				campusId: campuses[0].id,
				name: 'Computer Lab',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 32,
				description: 'Computer lab with 32 workstations and high-speed internet'
			},
			{
				campusId: campuses[0].id,
				name: 'Central Library',
				type: schema.schoolLocationTypeEnum.library,
				capacity: 80,
				description: 'Main library with study areas and computer terminals'
			},
			{
				campusId: campuses[0].id,
				name: 'Main Auditorium',
				type: schema.schoolLocationTypeEnum.auditorium,
				capacity: 500,
				description: 'Large auditorium for assemblies and presentations'
			},
			{
				campusId: campuses[0].id,
				name: 'Physics Lab',
				type: schema.schoolLocationTypeEnum.laboratory,
				capacity: 20,
				description: 'Specialized physics laboratory with experimental equipment'
			},
			{
				campusId: campuses[0].id,
				name: 'Room 201',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 26,
				description: 'Second floor classroom with natural lighting and modern furniture'
			},
			{
				campusId: campuses[0].id,
				name: 'Art Room',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 20,
				description: 'Creative arts classroom with easels, sinks, and storage for supplies'
			},
			{
				campusId: campuses[0].id,
				name: 'Music Room',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 35,
				description: 'Soundproofed music classroom with piano and instrument storage'
			}
		])
		.returning();

	// Seed school locations for South Campus
	const southCampusLocations = await db
		.insert(schema.schoolLocation)
		.values([
			{
				campusId: campuses[1].id,
				name: 'Main Gymnasium',
				type: schema.schoolLocationTypeEnum.gymnasium,
				capacity: 200,
				description: 'Large gymnasium for sports and physical education'
			},
			{
				campusId: campuses[1].id,
				name: 'Swimming Pool',
				type: schema.schoolLocationTypeEnum.pool,
				capacity: 40,
				description: '25-meter indoor swimming pool with diving board'
			},
			{
				campusId: campuses[1].id,
				name: 'Fitness Center',
				type: schema.schoolLocationTypeEnum.gymnasium,
				capacity: 50,
				description: 'Modern fitness center with cardio and weight equipment'
			},
			{
				campusId: campuses[1].id,
				name: 'Sports Hall A',
				type: schema.schoolLocationTypeEnum.gymnasium,
				capacity: 150,
				description: 'Multi-purpose sports hall for basketball, volleyball, and badminton'
			},
			{
				campusId: campuses[1].id,
				name: 'Sports Medicine Lab',
				type: schema.schoolLocationTypeEnum.laboratory,
				capacity: 15,
				description: 'Specialized laboratory for sports science and physiotherapy'
			},
			{
				campusId: campuses[1].id,
				name: 'Outdoor Sports Pavilion',
				type: schema.schoolLocationTypeEnum.auditorium,
				capacity: 300,
				description: 'Covered pavilion overlooking outdoor sports fields'
			},
			{
				campusId: campuses[1].id,
				name: 'Team Meeting Room',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 25,
				description: 'Meeting room for team briefings and strategy sessions'
			},
			{
				campusId: campuses[1].id,
				name: 'Room S101',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 28,
				description: 'Ground floor classroom with multimedia equipment'
			},
			{
				campusId: campuses[1].id,
				name: 'Room S102',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 30,
				description: 'Spacious classroom with flexible seating arrangements'
			},
			{
				campusId: campuses[1].id,
				name: 'Room S201',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 26,
				description: 'Second floor classroom with outdoor view and natural lighting'
			},
			{
				campusId: campuses[1].id,
				name: 'Room S202',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 24,
				description: 'Intimate classroom setting ideal for small group discussions'
			},
			{
				campusId: campuses[1].id,
				name: 'Health Education Room',
				type: schema.schoolLocationTypeEnum.classroom,
				capacity: 22,
				description: 'Specialized classroom for health and physical education theory classes'
			}
		])
		.returning();

	// Seed online classroom available to both campuses
	const onlineLocation = await db
		.insert(schema.schoolLocation)
		.values([
			{
				campusId: campuses[0].id,
				name: 'Virtual Classroom',
				type: schema.schoolLocationTypeEnum.online,
				capacity: 100,
				description: 'Online learning environment for remote classes accessible from both campuses'
			}
		])
		.returning();

	const allLocations = [...northCampusLocations, ...southCampusLocations, ...onlineLocation];

	console.log('North Campus locations:', northCampusLocations.length);
	console.log('South Campus locations:', southCampusLocations.length);

	return { school, campuses, schoolLocations: allLocations };
}
