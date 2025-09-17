import * as schema from './schema/index.js';
import { pgGenerate } from 'drizzle-dbml-generator'; // Using Postgres for this example

const out = './docs/diagrams/schema.dbml';

pgGenerate({ schema, out });
