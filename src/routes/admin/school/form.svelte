<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { schoolFormSchema, type SchoolFormSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import XIcon from '@lucide/svelte/icons/x';
	import { invalidateAll } from '$app/navigation';

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<SchoolFormSchema>>;
			school: { name: string; emailSuffix: string; logoUrl: string | null } | null;
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(schoolFormSchema),
		resetForm: false
	});

	const { form: formData, enhance: enhanceForm } = form;

	let logoInput: HTMLInputElement;
	let logoFile = $state<File | null>(null);
	let logoPreview = $state<string | null>(null);
	let uploading = $state(false);

	function handleLogoSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			logoFile = file;
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				logoPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function clearLogo() {
		logoFile = null;
		logoPreview = null;
		if (logoInput) {
			logoInput.value = '';
		}
	}

	async function uploadLogo() {
		if (!logoFile) return;

		uploading = true;
		const formData = new FormData();
		formData.append('logo', logoFile);

		try {
			const response = await fetch('?/uploadLogo', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				// Clear the preview and input
				clearLogo();
				// Invalidate to refresh the page data
				await invalidateAll();
			} else {
				console.error('Upload failed:', result.data?.message);
			}
		} catch (error) {
			console.error('Upload error:', error);
		} finally {
			uploading = false;
		}
	}

	function getSchoolInitials(name: string): string {
		return name
			.split(' ')
			.map((word) => word[0]?.toUpperCase())
			.join('')
			.slice(0, 2);
	}

	const currentLogo = $derived(logoPreview || data.school?.logoUrl);
	const hasLogo = $derived(Boolean(currentLogo));
</script>

<div class="max-w-2xl space-y-8">
	<!-- Logo Section -->
	<div class="space-y-4">
		<h3 class="text-lg font-medium">School Logo</h3>

		<div class="flex items-center gap-6">
			<Avatar.Root class="h-20 w-20">
				{#if hasLogo}
					<Avatar.Image src={currentLogo} alt="School logo" />
				{/if}
				<Avatar.Fallback class="text-lg">
					{data.school?.name ? getSchoolInitials(data.school.name) : 'SL'}
				</Avatar.Fallback>
			</Avatar.Root>

			<div class="flex-1 space-y-2">
				<div class="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={() => logoInput?.click()}
						disabled={uploading}
					>
						<UploadIcon class="mr-2 h-4 w-4" />
						{hasLogo ? 'Change Logo' : 'Upload Logo'}
					</Button>

					{#if logoFile}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={uploadLogo}
							disabled={uploading}
						>
							{uploading ? 'Uploading...' : 'Save Logo'}
						</Button>

						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={clearLogo}
							disabled={uploading}
						>
							<XIcon class="h-4 w-4" />
						</Button>
					{/if}
				</div>

				<input
					bind:this={logoInput}
					type="file"
					accept="image/jpeg,image/jpg,image/png,image/webp"
					onchange={handleLogoSelect}
					class="hidden"
				/>

				<p class="text-muted-foreground text-sm">
					Upload a JPEG, PNG, or WebP image. Maximum file size: 5MB.
				</p>
			</div>
		</div>
	</div>

	<!-- School Details Form -->
	<form method="POST" action="?/updateDetails" class="space-y-6" use:enhanceForm>
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>School Name</Form.Label>
					<Input
						{...props}
						bind:value={$formData.name}
						placeholder="Enter your school name"
						class="text-lg"
					/>
				{/snippet}
			</Form.Control>
			<Form.Description>
				This is the official name of your school that will appear throughout the system.
			</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="emailSuffix">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Email Domain</Form.Label>
					<div class="flex items-center">
						<span class="text-muted-foreground mr-1">@</span>
						<Input
							{...props}
							bind:value={$formData.emailSuffix}
							placeholder="school.edu"
							class="flex-1"
						/>
					</div>
				{/snippet}
			</Form.Control>
			<Form.Description>
				The email domain for your school (e.g., "school.edu" for emails like "student@school.edu").
			</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex justify-end gap-2">
			<Form.Button type="submit">Update School Details</Form.Button>
		</div>
	</form>
</div>
