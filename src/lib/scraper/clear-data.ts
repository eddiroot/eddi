#!/usr/bin/env node

import { db } from './db.js';
import {
	curriculum,
	curriculumSubject,
	learningArea,
	learningAreaContent,
	contentElaboration
} from '../server/db/schema.js';

async function clearData() {
	console.log('🧹 Clearing existing curriculum data...');

	try {
		// Delete in reverse order of dependencies
		await db.delete(contentElaboration);
		console.log('   ✅ Cleared content elaborations');

		await db.delete(learningAreaContent);
		console.log('   ✅ Cleared learning area content');

		await db.delete(learningArea);
		console.log('   ✅ Cleared learning areas');

		await db.delete(curriculumSubject);
		console.log('   ✅ Cleared curriculum subjects');

		await db.delete(curriculum);
		console.log('   ✅ Cleared curricula');

		console.log('🎉 All curriculum data cleared successfully!');
	} catch (error) {
		console.error('❌ Error clearing data:', error);
		process.exit(1);
	}

	process.exit(0);
}

clearData();
