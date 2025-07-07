<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { goto } from '$app/navigation';

	let formData = {
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: ''
	};

	let errors: Record<string, string> = {};

	function validateForm() {
		errors = {};

		if (!formData.firstName.trim()) {
			errors.firstName = 'First name is required';
		}

		if (!formData.lastName.trim()) {
			errors.lastName = 'Last name is required';
		}

		if (!formData.email.trim()) {
			errors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			errors.email = 'Please enter a valid email address';
		}

		if (!formData.password) {
			errors.password = 'Password is required';
		} else if (formData.password.length < 8) {
			errors.password = 'Password must be at least 8 characters';
		}

		if (formData.password !== formData.confirmPassword) {
			errors.confirmPassword = 'Passwords do not match';
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (validateForm()) {
			// Mock: In real implementation, this would create the account
			console.log('Creating account with:', formData);
			goto('/onboarding/self-setup/school-details');
		}
	}
</script>

<div class="flex h-full items-center justify-center p-4">
	<div class="w-full max-w-md">
		<Card>
			<CardHeader class="text-center">
				<CardTitle class="text-2xl">Create Your Account</CardTitle>
				<p class="text-muted-foreground text-sm">Let's start by setting up your admin account</p>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="firstName">First Name</Label>
						<Input
							id="firstName"
							bind:value={formData.firstName}
							placeholder="John"
							class={errors.firstName ? 'border-destructive' : ''}
						/>
						{#if errors.firstName}
							<p class="text-destructive text-xs">{errors.firstName}</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label for="lastName">Last Name</Label>
						<Input
							id="lastName"
							bind:value={formData.lastName}
							placeholder="Doe"
							class={errors.lastName ? 'border-destructive' : ''}
						/>
						{#if errors.lastName}
							<p class="text-destructive text-xs">{errors.lastName}</p>
						{/if}
					</div>
				</div>

				<div class="space-y-2">
					<Label for="email">Email Address</Label>
					<Input
						id="email"
						type="email"
						bind:value={formData.email}
						placeholder="john.doe@school.edu"
						class={errors.email ? 'border-destructive' : ''}
					/>
					{#if errors.email}
						<p class="text-destructive text-xs">{errors.email}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						bind:value={formData.password}
						placeholder="••••••••"
						class={errors.password ? 'border-destructive' : ''}
					/>
					{#if errors.password}
						<p class="text-destructive text-xs">{errors.password}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="confirmPassword">Confirm Password</Label>
					<Input
						id="confirmPassword"
						type="password"
						bind:value={formData.confirmPassword}
						placeholder="••••••••"
						class={errors.confirmPassword ? 'border-destructive' : ''}
					/>
					{#if errors.confirmPassword}
						<p class="text-destructive text-xs">{errors.confirmPassword}</p>
					{/if}
				</div>

				<div class="flex gap-4 pt-4">
					<Button variant="outline" href="/onboarding" class="flex-1">Back</Button>
					<button
						type="button"
						on:click={handleSubmit}
						class="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring h-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
					>
						Create Account
					</button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
