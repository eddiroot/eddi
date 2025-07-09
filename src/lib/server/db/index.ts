import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use env from $env/dynamic/private in SvelteKit context, otherwise use process.env
let DATABASE_URL: string;
try {
	const { env } = await import('$env/dynamic/private');
	DATABASE_URL = env.DATABASE_URL!;
} catch {
	DATABASE_URL = process.env.DATABASE_URL!;
}

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = postgres(DATABASE_URL);

export const db = drizzle(client, { schema });
