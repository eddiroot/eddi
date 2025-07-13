<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { goto } from '$app/navigation';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { enhance } from '$app/forms';

	interface AdminUser {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		role: string;
	}

	let adminUsers: AdminUser[] = [];
	let newUser = {
		firstName: '',
		lastName: '',
		email: '',
		role: 'Admin',
		password: '',
		passwordConfirm: ''
	};
	let errors: Record<string, string> = {};
	let successMessage = '';

	function validateNewUser() {
		errors = {};

		if (!newUser.firstName.trim()) {
			errors.firstName = 'First name is required';
		}

		if (!newUser.lastName.trim()) {
			errors.lastName = 'Last name is required';
		}

		if (!newUser.email.trim()) {
			errors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
			errors.email = 'Please enter a valid email address';
		} else if (adminUsers.some((user) => user.email === newUser.email)) {
			errors.email = 'This email is already added';
		}

		if (!newUser.password) {
			errors.password = 'Password is required';
		} else if (newUser.password.length < 8) {
			errors.password = 'Password must be at least 8 characters';
		}

		if (!newUser.passwordConfirm) {
			errors.passwordConfirm = 'Please confirm your password';
		} else if (newUser.password !== newUser.passwordConfirm) {
			errors.passwordConfirm = 'Passwords do not match';
		}

		return Object.keys(errors).length === 0;
	}

	function handleFinish() {
		// Mock: In real implementation, this would save admin users and complete onboarding
		console.log('Saving admin users:', adminUsers);
		goto('/dashboard');
	}

	function handleSkip() {
		// Mock: Skip adding additional admin users
		console.log('Skipping additional admin users');
		goto('/dashboard');
	}
</script>

<div class="flex h-full items-center justify-center p-4">
	<div class="w-full max-w-2xl">
		<Card>
			<CardHeader class="text-center">
				<CardTitle class="text-2xl">Add Admin Users</CardTitle>
				<p class="text-muted-foreground text-sm">
					Add other administrators who will help manage your school
				</p>
			</CardHeader>
			<CardContent class="space-y-6">
				<!-- Add New User Form -->
				<form method="POST" use:enhance on:submit|preventDefault>
					<div class="space-y-4 rounded-lg border p-4">
						<h3 class="font-semibold">Add New Administrator</h3>
						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="firstName">First Name</Label>
								<Input id="firstName" name="firstName" bind:value={newUser.firstName} placeholder="Jane" class={errors.firstName ? 'border-destructive' : ''} />
								{#if errors.firstName}
									<p class="text-destructive text-xs">{errors.firstName}</p>
								{/if}
							</div>
							<div class="space-y-2">
								<Label for="lastName">Last Name</Label>
								<Input id="lastName" name="lastName" bind:value={newUser.lastName} placeholder="Smith" class={errors.lastName ? 'border-destructive' : ''} />
								{#if errors.lastName}
									<p class="text-destructive text-xs">{errors.lastName}</p>
								{/if}
							</div>
						</div>
						<div class="space-y-2">
							<Label for="email">Email Address</Label>
							<Input id="email" name="email" type="email" bind:value={newUser.email} placeholder="jane.smith@school.edu" class={errors.email ? 'border-destructive' : ''} />
							{#if errors.email}
								<p class="text-destructive text-xs">{errors.email}</p>
							{/if}
						</div>
						<div class="space-y-2">
							<Label for="password">Password</Label>
							<Input id="password" name="password" type="password" bind:value={newUser.password} placeholder="Enter a password" class={errors.password ? 'border-destructive' : ''} />
							{#if errors.password}
								<p class="text-destructive text-xs">{errors.password}</p>
							{/if}
						</div>
						<div class="space-y-2">
							<Label for="passwordConfirm">Confirm Password</Label>
							<Input id="passwordConfirm" name="passwordConfirm" type="password" bind:value={newUser.passwordConfirm} placeholder="Confirm password" class={errors.passwordConfirm ? 'border-destructive' : ''} />
							{#if errors.passwordConfirm}
								<p class="text-destructive text-xs">{errors.passwordConfirm}</p>
							{/if}
						</div>
						<button type="submit" class="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring h-10 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">Add Administrator</button>
						{#if successMessage}
							<p class="text-success text-xs">{successMessage}</p>
						{/if}
					</div>
				</form>

				<!-- Added Users List -->
				{#if adminUsers.length > 0}
					<div class="space-y-4">
						<h3 class="font-semibold">Added Administrators ({adminUsers.length})</h3>
						<div class="space-y-2">
							{#each adminUsers as user (user.id)}
								<div class="flex items-center justify-between rounded-lg border p-3">
									<div class="flex items-center gap-3">
										<div
											class="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
										>
											{user.firstName.charAt(0)}{user.lastName.charAt(0)}
										</div>
										<div>
											<p class="font-medium">{user.firstName} {user.lastName}</p>
											<p class="text-muted-foreground text-sm">{user.email}</p>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<Badge variant="secondary">{user.role}</Badge>
										<Button
											type="button"
											onclick={() => removeUser(user.id)}
											aria-label="Remove user"
											variant="destructive"
											size="icon"
										>
											<Trash2Icon />
										</Button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="flex gap-4 pt-4">
					<Button variant="outline" href="/onboarding/self-setup/school-details" class="flex-1">
						Back
					</Button>
					<button
						type="button"
						on:click={handleSkip}
						class="border-input bg-background hover:bg-accent hover:text-accent-foreground ring-offset-background focus-visible:ring-ring h-10 flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
					>
						Skip for Now
					</button>
					<button
						type="button"
						on:click={handleFinish}
						class="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring h-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
					>
						Finish Setup
					</button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
