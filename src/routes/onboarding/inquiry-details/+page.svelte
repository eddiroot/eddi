<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let formData = {
		schoolName: '',
		schoolAddress: '',
		schoolPhone: '',
		schoolEmail: '',
	};

	let errors: Record<string, string> = {};
	let showSuccessModal = false;
	let isSubmitting = false;

	function validateForm() {
		errors = {};

		if (!formData.schoolName.trim()) {
			errors.schoolName = 'School name is required';
		}

		if (!formData.schoolAddress.trim()) {
			errors.schoolAddress = 'School address is required';
		}

		if (!formData.schoolEmail.trim()) {
			errors.schoolEmail = 'School email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.schoolEmail)) {
			errors.schoolEmail = 'Please enter a valid email address';
		}

		if (!formData.schoolPhone.trim()) {
			errors.schoolPhone = 'School phone number is required';
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (validateForm()) {
			isSubmitting = true;
			setTimeout(() => { // Simulate async
				isSubmitting = false;
				showSuccessModal = true;
			}, 800);
			// In real implementation, replace with actual API call and handle errors
		}
	}
</script>

<div class="flex h-full items-center justify-center p-4">
	<div class="w-full max-w-lg">
		<Card>
			<CardHeader class="text-center">
				<CardTitle class="text-2xl">Make an Inquiry</CardTitle>
				<p class="text-muted-foreground text-sm">Give us some basic details about your school, and we'll get back to you as soon as possible.</p>
			</CardHeader>
			<CardContent class="space-y-4">
				<form method="POST" use:enhance>
					<div class="mb-4">
						<Label for="schoolName" class="mb-2 block">School Name</Label>
						<Input id="schoolName" name="schoolName" bind:value={formData.schoolName} placeholder="Greenwood High School" class={(errors.schoolName ? 'border-destructive ' : '') + 'mt-2'} />
						<div class="h-4">
							{#if errors.schoolName}
								<p class="text-red-500 text-xs">{errors.schoolName}</p>
							{:else}
								<p class="text-xs invisible">placeholder</p>
							{/if}
						</div>
					</div>
					<div class="mb-4">
						<Label for="schoolAddress" class="mb-2 block">School Address</Label>
						<Input id="schoolAddress" name="schoolAddress" bind:value={formData.schoolAddress} placeholder="123 Education Street, Learning City, LC 12345" class={(errors.schoolAddress ? 'border-destructive ' : '') + 'mt-2'} />
						<div class="h-4">
							{#if errors.schoolAddress}
								<p class="text-red-500 text-xs">{errors.schoolAddress}</p>
							{:else}
								<p class="text-xs invisible">placeholder</p>
							{/if}
						</div>
					</div>
					<div class="mb-4">
						<Label for="schoolPhone" class="mb-2 block">Phone Number</Label>
						<Input id="schoolPhone" name="schoolPhone" bind:value={formData.schoolPhone} placeholder="(03) 9696 1234" type="tel" class="mt-2" />
						<div class="h-4">
							{#if errors.schoolPhone}
								<p class="text-red-500 text-xs">{errors.schoolPhone}</p>
							{:else}
								<p class="text-xs invisible">placeholder</p>
							{/if}
						</div>
					</div>
					<div class="mb-4">
						<Label for="schoolEmail" class="mb-2 block">School Email</Label>
						<Input id="schoolEmail" name="schoolEmail" type="email" bind:value={formData.schoolEmail} placeholder="info@school.edu" class={(errors.schoolEmail ? 'border-destructive ' : '') + 'mt-2'} />
						<div class="h-4">
							{#if errors.schoolEmail}
								<p class="text-red-500 text-xs">{errors.schoolEmail}</p>
							{:else}
								<p class="text-xs invisible">placeholder</p>
							{/if}
						</div>
					</div>
					<div class="flex gap-4 pt-4">
						<Button variant="outline" href="/onboarding" class="flex-1">Back</Button>
						<button type="button" on:click={handleSubmit} class="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring h-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" disabled={isSubmitting}>
							{#if isSubmitting}
								<span class="loader mr-2"></span>
							{/if}
							Inquire
						</button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div>

{#if showSuccessModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="bg-white rounded-lg p-8 shadow-lg text-center max-w-sm w-full">
			<svg class="mx-auto mb-4 text-green-500" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="12" fill="#22c55e" opacity="0.15"/><path stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 13l3 3 7-7"/></svg>
			<h2 class="text-xl font-bold mb-2">Your inquiry has been received!</h2>
			<p class="mb-6 text-muted-foreground">We will contact you at <span class="font-semibold">{formData.schoolEmail}</span> as soon as we can.</p>
			<Button onclick={() => goto('/')} class="w-full">Back</Button>
		</div>
	</div>
{/if}
