<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let formData = {
		schoolName: '',
		contactName: '',
		preferredContact: 'email',
		email: '',
		phone: '',
		additionalInfo: '',
		agreeToContact: false
	};

	let errors: Record<string, string> = {};
	let submitted = false;

	function validateForm() {
		errors = {};

		if (!formData.schoolName.trim()) {
			errors.schoolName = 'School name is required';
		}

		if (!formData.contactName.trim()) {
			errors.contactName = 'Contact name is required';
		}

		if (formData.preferredContact === 'email' || formData.preferredContact === 'both') {
			if (!formData.email.trim()) {
				errors.email = 'Email is required when selected as preferred contact';
			} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
				errors.email = 'Please enter a valid email address';
			}
		}

		if (formData.preferredContact === 'phone' || formData.preferredContact === 'both') {
			if (!formData.phone.trim()) {
				errors.phone = 'Phone number is required when selected as preferred contact';
			}
		}

		if (!formData.agreeToContact) {
			errors.agreeToContact = 'Please agree to be contacted by our team';
		}

		return Object.keys(errors).length === 0;
	}

	function handleSubmit() {
		if (validateForm()) {
			// Mock: In real implementation, this would submit the form to the team
			console.log('Submitting team help request:', formData);
			submitted = true;
		}
	}
</script>

<svelte:head>
	<title>Get Team Help - eddi</title>
</svelte:head>

<div class="flex h-full items-center justify-center p-4">
	<div class="max-w-lg">
		{#if submitted}
			<Card>
				<CardHeader class="text-center">
					<CardTitle class="text-2xl text-green-600">Request Submitted!</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4 text-center">
					<div class="rounded-lg border border-green-200 bg-green-50 p-4">
						<p class="text-green-800">
							Thank you for your request! Our team will reach out to you within 1 business day to
							schedule your setup session.
						</p>
					</div>

					<div class="space-y-2 text-left">
						<h3 class="text-sm font-semibold">What happens next:</h3>
						<ul class="text-muted-foreground space-y-1 text-sm">
							<li>
								• Our team will contact you via {formData.preferredContact === 'both'
									? 'email or phone'
									: formData.preferredContact}
							</li>
							<li>• We'll schedule a convenient time for your setup session</li>
							<li>• The session typically takes 30-60 minutes</li>
							<li>• We'll walk through the entire setup process together</li>
						</ul>
					</div>

					<Button href="/onboarding" class="w-full">Back to Onboarding</Button>
				</CardContent>
			</Card>
		{:else}
			<Card>
				<CardHeader class="text-center">
					<CardTitle class="text-2xl">Get Help from Our Team</CardTitle>
					<p class="text-muted-foreground text-sm">
						Book a personalised setup session with the eddi team
					</p>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="schoolName">School Name</Label>
						<Input
							id="schoolName"
							bind:value={formData.schoolName}
							placeholder="Greenwood High School"
							class={errors.schoolName ? 'border-destructive' : ''}
						/>
						{#if errors.schoolName}
							<p class="text-destructive text-xs">{errors.schoolName}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="contactName">Your Name</Label>
						<Input
							id="contactName"
							bind:value={formData.contactName}
							placeholder="John Doe"
							class={errors.contactName ? 'border-destructive' : ''}
						/>
						{#if errors.contactName}
							<p class="text-destructive text-xs">{errors.contactName}</p>
						{/if}
					</div>

					<div class="space-y-3">
						<Label>How would you prefer to be contacted?</Label>

						<div class="space-y-3">
							<label class="flex cursor-pointer items-center space-x-2">
								<input
									type="radio"
									bind:group={formData.preferredContact}
									value="email"
									class="text-primary focus:ring-primary h-4 w-4"
								/>
								<span class="text-sm">Email only</span>
							</label>

							<label class="flex cursor-pointer items-center space-x-2">
								<input
									type="radio"
									bind:group={formData.preferredContact}
									value="phone"
									class="text-primary focus:ring-primary h-4 w-4"
								/>
								<span class="text-sm">Phone only</span>
							</label>

							<label class="flex cursor-pointer items-center space-x-2">
								<input
									type="radio"
									bind:group={formData.preferredContact}
									value="both"
									class="text-primary focus:ring-primary h-4 w-4"
								/>
								<span class="text-sm">Either email or phone</span>
							</label>
						</div>
					</div>

					{#if formData.preferredContact === 'email' || formData.preferredContact === 'both'}
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
					{/if}

					{#if formData.preferredContact === 'phone' || formData.preferredContact === 'both'}
						<div class="space-y-2">
							<Label for="phone">Phone Number</Label>
							<Input
								id="phone"
								type="tel"
								bind:value={formData.phone}
								placeholder="+61 412 345 678"
								class={errors.phone ? 'border-destructive' : ''}
							/>
							{#if errors.phone}
								<p class="text-destructive text-xs">{errors.phone}</p>
							{/if}
						</div>
					{/if}

					<div class="space-y-2">
						<Label for="additionalInfo">Additional Information (Optional)</Label>
						<Textarea
							id="additionalInfo"
							bind:value={formData.additionalInfo}
							placeholder="Tell us about your school size, specific needs, or any questions you have..."
							rows={3}
						/>
						<p class="text-muted-foreground text-xs">
							This helps us prepare for your setup session
						</p>
					</div>

					<div class="flex items-start space-x-2">
						<Checkbox
							id="agreeToContact"
							bind:checked={formData.agreeToContact}
							class={errors.agreeToContact ? 'border-destructive' : ''}
						/>
						<div class="space-y-1">
							<Label for="agreeToContact" class="cursor-pointer text-sm font-normal">
								I agree to be contacted by the eddi team to schedule a setup session
							</Label>
							{#if errors.agreeToContact}
								<p class="text-destructive text-xs">{errors.agreeToContact}</p>
							{/if}
						</div>
					</div>

					<div class="flex gap-4 pt-4">
						<Button variant="outline" href="/onboarding" class="flex-1">Back</Button>
						<button
							type="button"
							on:click={handleSubmit}
							class="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring h-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
						>
							Submit Request
						</button>
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
