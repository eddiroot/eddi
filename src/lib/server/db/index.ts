import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Resource } from 'sst';
import * as schema from './schema';

const pool = new Pool({
	host: Resource.Database.host,
	port: Resource.Database.port,
	user: Resource.Database.username,
	password: Resource.Database.password,
	database: Resource.Database.database
});

export const db = drizzle(pool, { schema });
