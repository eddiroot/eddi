<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { goto } from '$app/navigation';

	let formData = {
		firstName: '',
		middleName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: '',
		gender: '',
		honorific: '',
		dateOfBirth: ''
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

		if (!formData.gender.trim()) {
			errors.gender = 'Gender is required';
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
			goto('/onboarding/self-setup/validate-email');
		}
	}
</script>

<svelte:head>
	<title>Create Account - eddi</title>
</svelte:head>

<div class="flex h-full items-center justify-center p-4">
	<div class="w-full max-w-md">
		<Card>
			<CardHeader class="text-center pb-0">
				<CardTitle class="text-2xl">Create Your Account</CardTitle>
				<p class="text-muted-foreground text-sm">Let's start by setting up your admin account</p>
			</CardHeader>
			<CardContent class="space-y-1 pt-0">
				<div class="space-y-0.5">
					<Label for="firstName">First Name</Label>
					<Input
						id="firstName"
						bind:value={formData.firstName}
						placeholder="John"
						class={errors.firstName ? 'border-destructive' : ''}
					/>
					<div class="h-3.5">
						{#if errors.firstName}
							<p class="text-red-500 text-xs">{errors.firstName}</p>
						{/if}
					</div>
				</div>
				<div class="space-y-0.5">
					<Label for="middleName">Middle Name (if applicable)</Label>
					<Input
						id="middleName"
						bind:value={formData.middleName}
						placeholder="Appleseed"
						class={errors.middleName ? 'border-destructive' : ''}
					/>
					<div class="h-3.5">
						{#if errors.middleName}
							<p class="text-red-500 text-xs">{errors.middleName}</p>
						{/if}
					</div>
				</div>
				<div class="space-y-0.5">
					<Label for="lastName">Last Name</Label>
					<Input
						id="lastName"
						bind:value={formData.lastName}
						placeholder="Doe"
						class={errors.lastName ? 'border-destructive' : ''}
					/>
					<div class="h-3.5">
						{#if errors.lastName}
							<p class="text-red-500 text-xs">{errors.lastName}</p>
						{/if}
					</div>
				</div>
				<div class="space-y-0.5">
					<Label for="dateOfBirth">Date of Birth</Label>
					<Input
						id="dateOfBirth"
						type="date"
						bind:value={formData.dateOfBirth}
						class={errors.dateOfBirth ? 'border-destructive' : ''}
					/>
					<div class="h-3.5">
						{#if errors.dateOfBirth}
							<p class="text-red-500 text-xs">{errors.dateOfBirth}</p>
						{/if}
					</div>
				</div>
				<div class="space-y-0.5">
					<Label for="gender">Gender</Label>
					<select
						id="gender"
						name="gender"
						bind:value={formData.gender}
						class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 {errors.gender
							? 'border-destructive'
							: ''}"
					>
						<option value="">Select gender</option>
						<option value="male">Male</option>
						<option value="female">Female</option>
						<option value="nonBinary">Non-binary</option>
						<option value="other">Other</option>
						<option value="unspecified">Unspecified</option>
					</select>
					<div class="h-3.5">
						{#if errors.gender}
							<p class="text-red-500 text-xs">{errors.gender}</p>
						{/if}
					</div>
				</div>
				<div class="space-y-0.5">
					<Label for="honorific">Title</Label>
					<select
						id="honorific"
						name="honorific"
						bind:value={formData.honorific}
						class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 {errors.honorific
							? 'border-destructive'
							: ''}"
					>
						<option value="">Select title (optional)</option>
						<option value="mr">Mr</option>
						<option value="ms">Ms</option>
						<option value="mrs">Mrs</option>
						<option value="dr">Dr</option>
						<option value="prof">Prof</option>
					</select>
					<div class="h-3.5">
						{#if errors.honorific}
							<p class="text-red-500 text-xs">{errors.honorific}</p>
						{/if}
					</div>
				</div>

				<div class="space-y-0.5">
					<Label for="email">Email Address</Label>
					<Input
						id="email"
						type="email"
						bind:value={formData.email}
						placeholder="john.doe@school.edu"
						class={errors.email ? 'border-destructive' : ''}
					/>
					<div class="h-3.5">
						{#if errors.email}
							<p class="text-red-500 text-xs">{errors.email}</p>
						{/if}
					</div>
				</div>

				<div class="space-y-0.5">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						bind:value={formData.password}
						placeholder="••••••••"
						class={errors.password ? 'border-destructive' : ''}
					/>
					<div class="h-3.5">
						{#if errors.password}
							<p class="text-red-500 text-xs">{errors.password}</p>
						{/if}
					</div>
				</div>

				<div class="space-y-0.5">
					<Label for="confirmPassword">Confirm Password</Label>
					<Input
						id="confirmPassword"
						type="password"
						bind:value={formData.confirmPassword}
						placeholder="••••••••"
						class={errors.confirmPassword ? 'border-destructive' : ''}
					/>
					<div class="h-3.5">
						{#if errors.confirmPassword}
							<p class="text-red-500 text-xs">{errors.confirmPassword}</p>
						{/if}
					</div>
				</div>

				<div class="flex gap-4 pt-2">
					<Button variant="outline" href="/onboarding" class="flex-1">Back</Button>
					<button
						type="button"
						onclick={handleSubmit}
						class="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring h-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
					>
						Create Account
					</button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
