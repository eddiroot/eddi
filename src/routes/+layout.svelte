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

	// Check if we're on a task page and get the task data
	const currentTask = $derived(() => {
		const pathname = page.url.pathname;
		const taskMatch = pathname.match(/\/tasks\/(\d+)/);

		console.log('pathname:', pathname);
		console.log('taskMatch:', taskMatch);
		console.log('page.data.task:', page.data?.task);
		console.log('task.aiTutorEnabled:', page.data?.task?.aiTutorEnabled);

		if (taskMatch && page.data?.task) {
			return page.data.task;
		}
		return null;
	});

	// Check if AI tutor should be shown
	const shouldShowAITutor = $derived(() => {
		const task = currentTask();
		console.log('currentTask:', task);
		console.log('task.aiTutorEnabled:', task?.aiTutorEnabled);

		// If we're on a task page, check if AI tutor is enabled for that task
		if (task) {
			const result = task.aiTutorEnabled !== false;
			console.log('shouldShowAITutor result:', result);
			return result;
		}

		// For non-task pages, show AI tutor by default
		console.log('Not on task page, showing AI tutor');
		return true;
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
				const subjectOfferingId = Number(segment);
				const subject = data?.subjects?.find((s) => s.subjectOffering.id === subjectOfferingId);
				label = subject?.subject.name || `Subject ${segment}`;
			} else if (
				segments[i - 1] === 'class' &&
				segments[i - 2] &&
				!isNaN(Number(segments[i - 2]))
			) {
				// This is the class ID in /subjects/[subjectOfferingId]/class/[classId]
				const subjectOfferingId = Number(segments[i - 2]);
				const classId = Number(segment);
				const subject = data?.subjects?.find((s) => s.subjectOffering.id === subjectOfferingId);
				const classItem = subject?.classes?.find((c) => c.id === classId);
				label = classItem?.name || `Class ${segment}`;
			} else if (segments[i - 1] === 'tasks' && !isNaN(Number(segment))) {
				const taskId = Number(segment);
				const pageData = page.data as any;
				const task = pageData?.task || pageData?.tasks?.find((l: any) => l.id === taskId);
				label = task?.title || `Task ${segment}`;
			} else if (segments[i - 1] === 'whiteboard' && !isNaN(Number(segment))) {
				const whiteboardId = Number(segment);
				const pageData = page.data as any;
				const whiteboard =
					pageData?.whiteboard || pageData?.whiteboards?.find((w: any) => w.id === whiteboardId);
				label = whiteboard?.title || `Whiteboard ${segment}`;
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
	<title>{data?.school?.name || 'eddi'}</title>
	<meta name="description" content="The AI-native LMS for schools" />
</svelte:head>
<ModeWatcher />
<Sidebar.Provider class="h-full" leftOpen={false} rightOpen={false}>
	{#if user()}
		<AppSidebar
			subjects={data.subjects}
			user={user()}
			school={data.school}
			campuses={data.campuses ?? []}
		/>
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
					{#if user() && isOnSubjectsPage() && shouldShowAITutor()}
						<Sidebar.Trigger name="right" aria-label="Toggle AI Helper" />
					{/if}
				</div>
			</nav>
		</header>
		<main class="flex-1 overflow-auto">
			{@render children()}
		</main>
	</div>
	{#if user() && isOnSubjectsPage() && shouldShowAITutor()}
		<AiSidebar subjectOfferingId={currentSubjectOfferingId()} />
	{/if}
</Sidebar.Provider>
