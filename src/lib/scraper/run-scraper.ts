#!/usr/bin/env node

import { VCAAF10Scraper } from './vcaaF10-scraper.js';

async function main() {
	const args = process.argv.slice(2);
	const scraper = new VCAAF10Scraper();

	console.log('🚀 Starting VCAA Curriculum Scraper (Complete F-10 Coverage)');
	console.log('============================================================');

	try {
		if (args.includes('--all')) {
			console.log('📚 Scraping ALL subjects (40+ curricula)...');
			await scraper.scrapeAll();
		} else if (args.includes('--mathematics')) {
			console.log('🔢 Scraping Mathematics curriculum...');
			const items = await scraper.scrapeSubject('mathematics');
			console.log(`✅ Found ${items.length} mathematics items`);
			await scraper.insertCurriculumData(items);
		} else if (args.includes('--english')) {
			console.log('📖 Scraping English curriculum...');
			const items = await scraper.scrapeSubject('english');
			console.log(`✅ Found ${items.length} english items`);
			await scraper.insertCurriculumData(items);
		} else if (args.includes('--science')) {
			console.log('🔬 Scraping Science curriculum...');
			const items = await scraper.scrapeSubject('science');
			console.log(`✅ Found ${items.length} science items`);
			await scraper.insertCurriculumData(items);
		} else if (args.includes('--technologies')) {
			console.log('🔧 Scraping Technologies subjects...');
			await scraper.scrapeTechnologies();
		} else if (args.includes('--humanities')) {
			console.log('🌍 Scraping Humanities subjects...');
			await scraper.scrapeHumanities();
		} else if (args.includes('--languages')) {
			console.log('🗣️ Scraping Languages subjects...');
			await scraper.scrapeLanguages();
		} else if (args.includes('--arts')) {
			console.log('🎨 Scraping The Arts subjects...');
			await scraper.scrapeArts();
		} else if (args.includes('--health')) {
			console.log('🏃 Scraping Health & Physical Education...');
			const items = await scraper.scrapeSubject('health-and-physical-education');
			console.log(`✅ Found ${items.length} health & PE items`);
			await scraper.insertCurriculumData(items);
		} else {
			console.log('📋 Available options:');
			console.log('');
			console.log('🎯 Core Subjects:');
			console.log('  --mathematics     Scrape Mathematics curriculum');
			console.log('  --english         Scrape English curriculum');
			console.log('  --science         Scrape Science curriculum');
			console.log('');
			console.log('📚 Subject Groups:');
			console.log('  --technologies    Scrape Technologies (Design & Digital)');
			console.log('  --humanities      Scrape Humanities (History, Geography, etc.)');
			console.log('  --languages       Scrape Languages (18 languages, F-10 & 7-10)');
			console.log('  --arts            Scrape The Arts (Dance, Drama, Music, etc.)');
			console.log('  --health          Scrape Health & Physical Education');
			console.log('');
			console.log('🌟 Complete Coverage:');
			console.log('  --all             Scrape ALL subjects (40+ curricula)');
			console.log('');
			console.log('🎯 Quick commands:');
			console.log('  npm run scrape:math        # Mathematics only');
			console.log('  npm run scrape:english     # English only');
			console.log('  npm run scrape:science     # Science only');
			console.log('  npm run scrape:all         # All subjects');
			console.log('');
			console.log('💡 Example: npm run scrape -- --technologies');
			return;
		}

		console.log('✅ Scraping completed successfully!');
		console.log('📊 Check your database for the imported curriculum data.');
		console.log('🔍 Run `npm run scrape:view` to see a summary of the data.');
	} catch (error) {
		console.error('❌ Scraping failed:', error);
		process.exit(1);
	}
}

main();
