<script lang="ts">
	import '../app.css';

	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogoutIcon from '@lucide/svelte/icons/log-out';
	import { buttonVariants } from '$lib/components/ui/button';
	import Button from '$lib/components/ui/button/button.svelte';

	let { children, data } = $props();

	const user = $derived(() => data?.user);
</script>

<div class="flex h-full flex-col">
	<header>
		<nav class="container mx-auto flex items-center justify-between px-4 pt-4 pb-2">
			<a href="/" class="text-2xl font-bold">eddy</a>
			{#if user()}
				<ul class="flex space-x-2">
					<li>
						<a
							href="/subjects"
							class={buttonVariants({ variant: 'ghost', size: 'icon' })}
							aria-label="Subjects"
						>
							<LayoutDashboard />
						</a>
					</li>

					<li>
						<form method="post" action="/?/logout" class="inline">
							<Button type="submit" variant="ghost" size="icon" aria-label="Logout">
								<LogoutIcon />
							</Button>
						</form>
					</li>
				</ul>
			{/if}
			{#if !user()}
				<ul class="flex space-x-2">
					<li>
						<a href="/auth/login" class={buttonVariants({ variant: 'default' })}>Login</a>
					</li>
				</ul>
			{/if}
		</nav>
	</header>
	<div class="container mx-auto flex-1 px-4 py-4">
		{@render children()}
	</div>
	<footer>
		<div class="container mx-auto px-4 py-4 text-center">
			<p class="text-sm">&copy; 2025 eddy. All rights reserved.</p>
		</div>
	</footer>
</div>
