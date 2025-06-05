<script lang="ts">
	import '../app.css';

	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import BellIcon from '@lucide/svelte/icons/bell';
	import LogoutIcon from '@lucide/svelte/icons/log-out';

	let { children, data } = $props();

	const user = $derived(() => data?.user);
</script>

<div class="flex h-full flex-col">
	<header>
		<nav class="container mx-auto flex items-center justify-between px-4 pb-2 pt-4">
			<a href="/" class="text-2xl font-bold">eddy</a>
			{#if user()}
				<ul class="flex space-x-2">
					<li>
						<a href="/subjects" class="btn btn-square btn-primary">
							<LayoutDashboard />
						</a>
					</li>
					<li>
						<div class="drawer">
							<input id="drawer-notifications" type="checkbox" class="drawer-toggle" />
							<div class="drawer-content">
								<label for="drawer-notifications" class="btn btn-square btn-secondary drawer-button"
									><BellIcon /></label
								>
							</div>
							<div class="drawer-side">
								<label for="drawer-notifications" aria-label="close sidebar" class="drawer-overlay"
								></label>
								<ul class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
									<li>Notification 1</li>
									<li>Notification 2</li>
								</ul>
							</div>
						</div>
					</li>
					<li>
						<form method="post" action="/?/logout" class="inline">
							<button type="submit" class="btn btn-square btn-warning">
								<LogoutIcon />
							</button>
						</form>
					</li>
				</ul>
			{/if}
			{#if !user()}
				<ul class="flex space-x-2">
					<li>
						<a href="/auth/login" class="btn btn-primary">Login</a>
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
