import { db } from './db.js';
import {
	curriculum,
	curriculumSubject,
	learningArea,
	learningAreaContent,
	contentElaboration
} from '../../src/lib/server/db/schema.js';
import { eq, count } from 'drizzle-orm';

async function viewScrapedData() {
	console.log('📊 VCAA Curriculum Data Summary');
	console.log('================================');

	try {
		// Get all curricula
		const curricula = await db.select().from(curriculum);
		console.log(`\n📚 Found ${curricula.length} curricula:`);

		for (const curr of curricula) {
			console.log(`   • ${curr.name} (v${curr.version})`);

			// Get subjects for this curriculum
			const subjects = await db
				.select()
				.from(curriculumSubject)
				.where(eq(curriculumSubject.curriculumId, curr.id));

			console.log(`     Subjects: ${subjects.length}`);

			for (const subject of subjects) {
				console.log(`     📖 ${subject.name}`);

				// Get learning areas for this subject
				const areas = await db
					.select()
					.from(learningArea)
					.where(eq(learningArea.curriculumSubjectId, subject.id));

				console.log(`        Learning Areas: ${areas.length}`);

				for (const area of areas) {
					// Count content descriptions for this area
					const [contentCount] = await db
						.select({ count: count() })
						.from(learningAreaContent)
						.where(eq(learningAreaContent.learningAreaId, area.id));

					// Count elaborations for this area
					const elaborationCount = await db
						.select({ count: count() })
						.from(contentElaboration)
						.leftJoin(
							learningAreaContent,
							eq(contentElaboration.learningAreaContentId, learningAreaContent.id)
						)
						.where(eq(learningAreaContent.learningAreaId, area.id));

					console.log(
						`        🎯 ${area.name}: ${contentCount.count} content descriptions, ${elaborationCount[0]?.count || 0} elaborations`
					);
				}
			}
		}

		// Show some sample content
		console.log('\n📝 Sample Content Descriptions:');
		console.log('==================================');

		const sampleContent = await db
			.select({
				subjectName: curriculumSubject.name,
				areaName: learningArea.name,
				contentName: learningAreaContent.name,
				yearLevel: learningAreaContent.yearLevel,
				description: learningAreaContent.description
			})
			.from(learningAreaContent)
			.leftJoin(learningArea, eq(learningAreaContent.learningAreaId, learningArea.id))
			.leftJoin(curriculumSubject, eq(learningArea.curriculumSubjectId, curriculumSubject.id))
			.limit(5);

		for (const content of sampleContent) {
			console.log(`\n📌 ${content.subjectName} > ${content.areaName} > ${content.yearLevel}`);
			console.log(`   Title: ${content.contentName}`);
			console.log(`   Description: ${content.description?.substring(0, 150)}...`);
		}

		// Show some sample elaborations
		console.log('\n🔍 Sample Elaborations:');
		console.log('========================');

		const sampleElaborations = await db
			.select({
				elaborationName: contentElaboration.name,
				elaborationText: contentElaboration.contentElaboration,
				contentName: learningAreaContent.name
			})
			.from(contentElaboration)
			.leftJoin(
				learningAreaContent,
				eq(contentElaboration.learningAreaContentId, learningAreaContent.id)
			)
			.limit(3);

		for (const elaboration of sampleElaborations) {
			console.log(`\n💡 For: ${elaboration.contentName}`);
			console.log(`   ${elaboration.elaborationText?.substring(0, 200)}...`);
		}
	} catch (error) {
		console.error('❌ Error viewing data:', error);
		process.exit(1);
	}
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
	viewScrapedData().then(() => {
		console.log('\n✅ Data summary complete!');
		process.exit(0);
	});
}

export { viewScrapedData };
