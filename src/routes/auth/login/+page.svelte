<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	let { form } = $props();
</script>

<div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-sm">
		<h2 class="text-center text-2xl/9 font-bold tracking-tight">Sign in to your account</h2>
	</div>
	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<form class="space-y-6" method="post" action="?/login" use:enhance>
			<div>
				<label for="email" class="block text-sm/6 font-medium">Email address</label>
				<div class="mt-2">
					<Input
						type="email"
						name="email"
						id="email"
						autocomplete="email"
						required
						class="input w-full"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<label for="password" class="block text-sm/6 font-medium">Password</label>
				<div class="mt-2">
					<Input
						type="password"
						name="password"
						id="password"
						autocomplete="current-password"
						required
						class="input w-full"
					/>
				</div>
				<div class="text-right text-sm">
					<a href="forgot-password" class="text-primary font-semibold">Forgot password?</a>
				</div>
			</div>
			<Button class="w-full" type="submit">Sign in</Button>
		</form>
	</div>

	<p style="color: red">{form?.message ?? ''}</p>
</div>
