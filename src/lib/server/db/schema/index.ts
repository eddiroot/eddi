// Re-export all schema definitions and types from individual schema files
// This allows importing directly from $lib/server/db/schema instead of specific files

// Chatbot schemas
export * from './chatbot.js';

// Lesson schemas
export * from './task.js';

// School schemas
export * from './schools.js';

// Subject schemas
export * from './subjects.js';

// User schemas
export * from './user.js';

// Utility schemas
export * from './utils.js';
