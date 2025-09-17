import { pgGenerate } from 'drizzle-dbml-generator'; // Using Postgres for this example
import * as schema from './schema/index.js';

const out = './docs/diagrams/schema.dbml';

pgGenerate({ schema, out });
