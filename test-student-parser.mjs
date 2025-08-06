import { readFile } from 'fs/promises';
import { StudentStatisticsParser } from '../src/routes/admin/timetables/[timetableId]/result/utils.js';

async function test() {
	try {
		const htmlContent = await readFile(
			'./docs/timetabling/example/period_students_statistics.html',
			'utf-8'
		);
		const report = await StudentStatisticsParser.parseStudentStatisticsReport(htmlContent);

		console.log('=== Student Statistics Report ===');
		console.log('Institution:', report.metadata.institutionName);
		console.log('Generated with:', report.metadata.generatedWith);
		console.log('Generated at:', report.metadata.generatedAt);
		console.log();

		console.log('=== Overall Statistics ===');
		console.log('Sum:', report.overall.sum);
		console.log('Average:', report.overall.average);
		console.log('Min:', report.overall.min);
		console.log('Max:', report.overall.max);
		console.log();

		console.log('=== Year Levels ===');
		console.log('Total year levels:', report.yearLevels.length);
		report.yearLevels.forEach((year) => {
			console.log(
				`${year.year}: ${year.minHoursPerWeek}-${year.maxHoursPerWeek} hours/week, ${year.minGapsPerWeek}-${year.maxGapsPerWeek} gaps/week`
			);
		});
		console.log();

		console.log('=== Groups ===');
		console.log('Total groups:', report.groups.length);
		report.groups.slice(0, 5).forEach((group) => {
			console.log(
				`${group.group}: ${group.minHoursPerWeek}-${group.maxHoursPerWeek} hours/week, ${group.minGapsPerWeek}-${group.maxGapsPerWeek} gaps/week`
			);
		});
		console.log('...');
		console.log();

		console.log('=== Subgroups ===');
		console.log('Total subgroups:', report.subgroups.length);
		report.subgroups.slice(0, 5).forEach((subgroup) => {
			console.log(
				`${subgroup.subgroup}: ${subgroup.hoursPerWeek} hours/week, ${subgroup.totalGaps} total gaps`
			);
		});
		console.log('...');

		console.log('\n✅ Test completed successfully!');
	} catch (error) {
		console.error('❌ Test failed:', error);
	}
}

test();
