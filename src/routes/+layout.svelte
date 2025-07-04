<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';

	import { page } from '$app/state';

	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import AiSidebar from '$lib/components/ai-sidebar.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let { children, data } = $props();

	const user = $derived(() => data?.user);

	// Extract subjectOfferingId from URL if on a subject-specific page
	const currentSubjectOfferingId = $derived(() => {
		const pathname = page.url.pathname;
		const subjectMatch = pathname.match(/^\/subjects\/(\d+)/);
		return subjectMatch ? parseInt(subjectMatch[1], 10) : null;
	});

	// Check if user is on any subjects page
	const isOnSubjectsPage = $derived(() => {
		const pathname = page.url.pathname;
		return pathname.startsWith('/subjects/');
	});

	const generateBreadcrumbItems = (url: string) => {
		const segments = url.split('/').filter(Boolean);

		if (segments.length === 0) {
			return [];
		}

		const items: Array<{ label: string; href: string; isLast: boolean }> = [];
		let currentPath = '';

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			currentPath += `/${segment}`;

			let label = segment;
			let href = currentPath;

			if (segments[i - 1] === 'subjects' && !isNaN(Number(segment))) {
				const subjectId = Number(segment);
				const subject = data?.subjects?.find((s) => s.id === subjectId);
				label = subject?.name || `Subject ${segment}`;
			} else {
				label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
			}

			items.push({
				label,
				href,
				isLast: i === segments.length - 1
			});
		}

		return items;
	};
</script>

<svelte:head>
	<title>eddi</title>
	<meta name="description" content="The AI-native LMS for schools" />
</svelte:head>
<ModeWatcher />
<Sidebar.Provider class="h-full" leftOpen={false} rightOpen={false}>
	{#if user()}
		<AppSidebar subjects={data.subjects} user={user()} />
	{/if}
	<div class="relative flex h-full w-full flex-col">
		<header
			class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 backdrop-blur"
		>
			<nav class="mx-auto flex items-center justify-between border-b px-4 py-2">
				<div class="flex items-center gap-x-4">
					{#if user()}
						<Sidebar.Trigger name="left" aria-label="Toggle Navigation Sidebar" />
					{/if}
					<Breadcrumb.Root>
						<Breadcrumb.List>
							{#each generateBreadcrumbItems(page.url.pathname) as item}
								<Breadcrumb.Item>
									{#if item.isLast}
										<Breadcrumb.Page>{item.label}</Breadcrumb.Page>
									{:else}
										<Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
									{/if}
								</Breadcrumb.Item>
								{#if !item.isLast}
									<Breadcrumb.Separator />
								{/if}
							{/each}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>
				<div class="flex items-center space-x-4">
					{#if !user() && page.url.pathname !== '/auth/login'}
						<Button href="/auth/login">Login</Button>
					{/if}
					<ThemeToggle />
					{#if user() && isOnSubjectsPage()}
						<Sidebar.Trigger name="right" aria-label="Toggle AI Helper" />
					{/if}
				</div>
			</nav>
		</header>
		<main class="flex-1 overflow-auto">
			{@render children()}
		</main>
	</div>
	{#if user() && isOnSubjectsPage()}
		<AiSidebar subjectOfferingId={currentSubjectOfferingId()} />
	{/if}
</Sidebar.Provider>
