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
		logoFile: null as File | null
	};

	let errors: Record<string, string> = {};
	let logoPreview = '';

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

		return Object.keys(errors).length === 0;
	}

	function handleLogoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			formData.logoFile = file;
			const reader = new FileReader();
			reader.onload = (e) => {
				logoPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function handleSubmit() {
		if (validateForm()) {
			// Mock: In real implementation, this would save school details
			console.log('Saving school details:', formData);
			goto('/onboarding/self-setup/validate-email');
		}
	}
</script>

<div class="flex h-full items-center justify-center p-4">
	<div class="w-full max-w-lg">
		<Card>
			<CardHeader class="text-center">
				<CardTitle class="text-2xl">School Details</CardTitle>
				<p class="text-muted-foreground text-sm">Tell us about your school</p>
			</CardHeader>
			<CardContent class="space-y-4">
				<form method="POST" use:enhance>
					<div class="space-y-2">
						<Label for="schoolName">School Name</Label>
						<Input id="schoolName" name="schoolName" bind:value={formData.schoolName} placeholder="Greenwood High School" class={errors.schoolName ? 'border-destructive' : ''} />
						<div class="h-4">
							{#if errors.schoolName}
								<p class="text-destructive text-xs">{errors.schoolName}</p>
							{/if}
						</div>
					</div>
					<div class="space-y-2">
						<Label for="schoolAddress">School Address</Label>
						<Textarea id="schoolAddress" name="schoolAddress" bind:value={formData.schoolAddress} placeholder="123 Education Street, Learning City, LC 12345" class={errors.schoolAddress ? 'border-destructive' : ''} rows={3} />
						<div class="h-4">
							{#if errors.schoolAddress}
								<p class="text-destructive text-xs">{errors.schoolAddress}</p>
							{/if}
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="schoolPhone">Phone Number</Label>
							<Input id="schoolPhone" name="schoolPhone" bind:value={formData.schoolPhone} placeholder="(03) 9696 1234" type="tel" />
						</div>
						<div class="space-y-2">
							<Label for="schoolEmail">School Email</Label>
							<Input id="schoolEmail" name="schoolEmail" type="email" bind:value={formData.schoolEmail} placeholder="info@school.edu" class={errors.schoolEmail ? 'border-destructive' : ''} />
							<div class="h-4">
								{#if errors.schoolEmail}
									<p class="text-destructive text-xs">{errors.schoolEmail}</p>
								{/if}
							</div>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="logo">School Logo (Optional)</Label>
						<div class="flex items-center gap-4">
							{#if logoPreview}
								<img src={logoPreview} alt="Logo preview" class="h-16 w-16 rounded border object-contain" />
							{/if}
							<input id="logo" name="logo" type="file" accept="image/*" on:change={handleLogoUpload} class="text-muted-foreground border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50" />
						</div>
						<p class="text-muted-foreground text-xs">Upload a PNG, JPG, or SVG file (recommended: 200x200px)</p>
					</div>
					<div class="flex gap-4 pt-4">
						<Button variant="outline" href="/onboarding/self-setup" class="flex-1">Back</Button>
						
						<button type="button" on:click={handleSubmit} class="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring h-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">Continue</button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
