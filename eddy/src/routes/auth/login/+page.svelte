<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-sm">
		<h2 class="mt-10 text-center text-2xl/9 font-bold tracking-tight">Sign in to your account</h2>
	</div>
	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<form class="space-y-6" method="post" action="?/login" use:enhance>
			<div>
				<label for="email" class="block text-sm/6 font-medium">Email address</label>
				<div class="mt-2">
					<input
						type="email"
						name="email"
						id="email"
						autocomplete="email"
						required
						class="input w-full"
					/>
				</div>
			</div>

			<div>
				<div class="flex items-center justify-between">
					<label for="password" class="block text-sm/6 font-medium">Password</label>
					<div class="text-sm">
						<a href="forgot-password" class="font-semibold text-indigo-600 hover:text-indigo-500"
							>Forgot password?</a
						>
					</div>
				</div>
				<div class="mt-2">
					<input
						type="password"
						name="password"
						id="password"
						autocomplete="current-password"
						required
						class="input w-full"
					/>
				</div>
			</div>

			<button type="submit" class="btn btn-primary w-full">Sign in</button>
		</form>
	</div>

	<p style="color: red">{form?.message ?? ''}</p>
</div>
