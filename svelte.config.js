import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// csp: {
		// 	directives: {
		// 		'script-src': ['self']
		// 	}
		// 	reportOnly: {
		// 		'script-src': ['self'],
		// 		'report-uri': ['/'],
		// 		'report-to': ['/']
		// 	}
		// },
		csrf: {
			// enabled by default, but included for clarity
			checkOrigin: true
		}
	}
};

export default config;
