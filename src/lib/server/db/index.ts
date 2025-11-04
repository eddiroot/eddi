import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: 20, 
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000
});

// Drizzle instance using the pool
export const db = drizzle(pool, { schema });

// Graceful shutdown
if (typeof process !== 'undefined') {
	process.on('SIGINT', async () => {
		await pool.end();
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		await pool.end();
		process.exit(0);
	});
}
