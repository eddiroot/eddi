<script lang="ts">
	import '../app.css';

	import LogoutIcon from '@lucide/svelte/icons/log-out';
	import { buttonVariants } from '$lib/components/ui/button';
	import Button from '$lib/components/ui/button/button.svelte';

	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';

	let { children, data } = $props();

	const user = $derived(() => data?.user);
</script>

<Sidebar.Provider class="h-full" open={false}>
	{#if user()}
		<AppSidebar subjects={data.subjects} />
	{/if}
	<div class="flex h-full w-full flex-col">
		<header>
			<nav class="container mx-auto flex items-center justify-between px-4 pt-4 pb-2">
				<a href="/" class="text-2xl font-bold">eddy</a>
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
			</nav>
		</header>
		<main class="container mx-auto flex-1 px-4 py-4">
			{@render children()}
		</main>
		<footer>
			<div class="container mx-auto px-4 py-4 text-center">
				<p class="text-sm">&copy; 2025 eddy. All rights reserved.</p>
			</div>
		</footer>
	</div>
</Sidebar.Provider>
