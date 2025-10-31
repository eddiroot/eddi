<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';

	import { page } from '$app/state';

	import { AiSidebar } from '$lib/components/ai-sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children, data } = $props();

	const user = $derived(() => data?.user);

	// Header element reference for dynamic height calculation
	let headerElement: HTMLElement;
	let headerHeight = $state(0);

	// Sidebar state for dynamic resizing
	let sidebarWidth = $state(400);
	let sidebarOpen = $state(false);

	// Function to handle sidebar state changes
	function handleSidebarStateChange(controller: any) {
		if (controller) {
			const state = controller.getState();
			sidebarWidth = state.width;
			sidebarOpen = state.isOpen;
		}
	}

	// Determine the sidebar context based on current page
	const sidebarContext = $derived(() => {
		const pathname = page.url.pathname;

		if (pathname.includes('/tasks/')) {
			return 'task';
		} else if (pathname.includes('/lessons/') || pathname.includes('/class/')) {
			return 'lesson';
		} else {
			return 'general';
		}
	});

	// Extract subjectOfferingId from URL if on a subject-specific page
	const currentSubjectOfferingId = $derived(() => {
		const pathname = page.url.pathname;
		const subjectMatch = pathname.match(/^\/subjects\/(\d+)/);
		return subjectMatch ? parseInt(subjectMatch[1], 10) : null;
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

	// Update header height when component mounts or window resizes
	function updateHeaderHeight() {
		if (headerElement) {
			headerHeight = headerElement.offsetHeight;
		}
	}

	// Update header height on mount and resize
	$effect(() => {
		updateHeaderHeight();
		window.addEventListener('resize', updateHeaderHeight);
		return () => window.removeEventListener('resize', updateHeaderHeight);
	});
</script>

<svelte:head>
	<title>{data?.school?.name || 'eddi'}</title>
	<meta name="description" content="The AI-native LMS for schools" />
</svelte:head>
<ModeWatcher />
<Sidebar.Provider class="h-full" leftOpen={false} rightOpen={false}>
	{#if user()}
		<AppSidebar
			subjects={data?.subjects || []}
			user={user()}
			school={data?.school || null}
			campuses={data?.campuses ?? []}
			hasInterviewSlots={data?.hasInterviewSlots ?? false}
		/>
	{/if}
	<div class="relative flex h-full w-full flex-col">
		<header
			class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 backdrop-blur"
			bind:this={headerElement}
		>
			<nav class="mx-auto flex items-center justify-between border-b px-4 py-2">
				<div class="flex items-center gap-x-4">
					{#if user()}
						<Sidebar.Trigger name="left" aria-label="Toggle Navigation Sidebar" />
					{/if}
					<Breadcrumb.Root>
						<Breadcrumb.List>
							<Breadcrumb.Item>
								<Breadcrumb.Page class="font-bold">{data?.school?.name || 'eddi'}</Breadcrumb.Page>
							</Breadcrumb.Item>
							{#if generateBreadcrumbItems(page.url.pathname).length > 0}
								<Breadcrumb.Separator />
							{/if}
							{#each generateBreadcrumbItems(page.url.pathname) as item (item.href)}
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
					{#if !user() && page.url.pathname !== '/login'}
						<Button href="/login">Login</Button>
					{/if}
					<ThemeToggle />
				</div>
			</nav>
		</header>

		<!-- Main content area below header -->
		<div class="relative flex-1" style="padding-top: {headerHeight}px;">
			<main
				class="h-full overflow-auto transition-all duration-300"
				style={sidebarOpen ? `margin-right: ${sidebarWidth}px` : ''}
			>
				{@render children()}
			</main>

			<!-- AI Sidebar Containerm -->
			<div class="pointer-events-none fixed right-0 bottom-0 z-40" style="top: {headerHeight}px;">
				<AiSidebar
					context={sidebarContext()}
					enabled={true}
					subjectOfferingId={user() ? (currentSubjectOfferingId() ?? undefined) : undefined}
					onStateChange={handleSidebarStateChange}
				/>
			</div>
		</div>
	</div>
</Sidebar.Provider>
