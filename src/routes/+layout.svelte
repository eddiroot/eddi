<script lang="ts">
	import '../app.css';

	import LogoutIcon from '@lucide/svelte/icons/log-out';
	import { buttonVariants } from '$lib/components/ui/button';
	import Button from '$lib/components/ui/button/button.svelte';

	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { page } from '$app/state';

	let { children, data } = $props();

	const user = $derived(() => data?.user);

	const breadcrumbItems = $derived(() => {
		const url = page?.url?.pathname || '';
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
	});
</script>

<ModeWatcher />
<Sidebar.Provider class="h-full" open={false}>
	{#if user()}
		<AppSidebar subjects={data.subjects} user={user()} />
	{/if}
	<div class="flex h-full w-full flex-col">
		<header>
			<nav class="container mx-auto flex items-center justify-between px-4 pt-4 pb-2">
				<div>
					<Sidebar.Trigger />
					{#if breadcrumbItems.length > 0}
						<Breadcrumb.Root>
							<Breadcrumb.List>
								{#each breadcrumbItems() as item}
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
					{/if}
				</div>
				<div class="flex items-center space-x-4">
					{#if user()}
						<form method="post" action="/?/logout" class="inline">
							<Button type="submit" variant="ghost" size="icon" aria-label="Logout">
								<LogoutIcon />
							</Button>
						</form>
					{/if}
					{#if !user()}
						<a href="/auth/login" class={buttonVariants({ variant: 'default' })}>Login</a>
					{/if}
					<ThemeToggle />
				</div>
			</nav>
		</header>
		<main class="container mx-auto flex-1 px-4 py-4">
			{@render children()}
		</main>
		<footer>
			<div class="container mx-auto px-4 py-4 text-center">
				<p class="text-sm">&copy; 2025 eddi. All rights reserved.</p>
			</div>
		</footer>
	</div>
</Sidebar.Provider>
