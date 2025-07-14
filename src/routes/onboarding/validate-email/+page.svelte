<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import MailIcon from '@lucide/svelte/icons/mail';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import { goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';

	let verificationCode = ['', '', '', '', '', ''];
	let isResending = false;
	let countdown = 0;
	let isSubmitting = false;

	// Handle verification code input
	async function handleCodeInput(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		let value = target.value.replace(/\D/g, '');

		if (value.length > 1) {
			// Handle paste or multiple digits
			const chars = value.split('');
			for (let i = 0; i < chars.length && index + i < 6; i++) {
				verificationCode[index + i] = chars[i];
			}
			// Wait for DOM update
			await tick();
			let nextIndex = Math.min(index + value.length, 5);
			const nextInput = document.getElementById(`code-${nextIndex}`) as HTMLInputElement;
			if (nextInput) {
				nextInput.focus();
				nextInput.select();
			}
		} else if (value.length === 1) {
			verificationCode[index] = value;
			// Wait for DOM update before moving focus
			await tick();
			// Move focus to next input
			if (index < 5) {
				const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
				if (nextInput) {
					nextInput.focus();
					nextInput.select();
				}
			}
		} else {
			verificationCode[index] = '';
		}
	}

	// Handle backspace and other key events
	async function handleKeydown(index: number, event: KeyboardEvent) {
		if (event.key === 'Backspace') {
			if (!verificationCode[index] && index > 0) {
				// If current input is empty and backspace is pressed, go to previous input
				event.preventDefault();
				const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
				if (prevInput) {
					verificationCode[index - 1] = '';
					await tick();
					prevInput.focus();
					prevInput.select();
				}
			}
		} else if (event.key === 'ArrowLeft' && index > 0) {
			const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
			if (prevInput) {
				prevInput.focus();
				prevInput.select();
			}
		} else if (event.key === 'ArrowRight' && index < 5) {
			const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
			if (nextInput) {
				nextInput.focus();
				nextInput.select();
			}
		}
	}

	// Handle paste event
	async function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const paste = event.clipboardData?.getData('text') || '';
		const digits = paste.replace(/\D/g, '').slice(0, 6);
		
		if (digits.length > 0) {
			for (let i = 0; i < digits.length && i < 6; i++) {
				verificationCode[i] = digits[i];
			}
			await tick();
			// Focus on the next empty input or the last input
			const nextIndex = Math.min(digits.length, 5);
			const nextInput = document.getElementById(`code-${nextIndex}`) as HTMLInputElement;
			if (nextInput) {
				nextInput.focus();
				nextInput.select();
			}
		}
	}

	// Get the full verification code as string
	$: fullVerificationCode = verificationCode.join('');

	// Handle form submission
	async function handleSubmit() {
		if (fullVerificationCode.length !== 6) return;
		
		isSubmitting = true;
		try {
			// TODO: Implement verification logic
			console.log('Verifying code:', fullVerificationCode);
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// TODO: Navigate to next step on success
			goto('/onboarding/inquiry-details');
		} catch (error) {
			console.error('Verification failed:', error);
		} finally {
			isSubmitting = false;
		}
	}

	// Handle resend email
	async function handleResend() {
		if (countdown > 0) return;
		
		isResending = true;
		try {
			// TODO: Implement resend logic
			console.log('Resending verification email');
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Start countdown
			countdown = 60;
			const timer = setInterval(() => {
				countdown--;
				if (countdown <= 0) {
					clearInterval(timer);
				}
			}, 1000);
		} catch (error) {
			console.error('Resend failed:', error);
		} finally {
			isResending = false;
		}
	}

	// Auto-focus the first input on mount
	onMount(() => {
		const input = document.getElementById('code-0') as HTMLInputElement;
		if (input) {
			input.focus();
			input.select();
		}
	});
</script>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="w-full max-w-md mx-auto">
		<!-- Back button -->
		<button
			on:click={() => goto('/onboarding/self-setup/school-details')}
			class="mb-6 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
		>
			<ArrowLeftIcon class="w-4 h-4 mr-2" />
			Back to school details
		</button>

		<Card>
			<CardHeader class="text-center">
				<div class="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
					<MailIcon class="w-6 h-6 text-primary" />
				</div>
				<CardTitle class="text-2xl">Verify your email</CardTitle>
				<CardDescription>
					We've sent a 6-digit verification code to your email address. Please enter it below.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div class="space-y-2">
						<div class="flex gap-2 justify-center">
							{#each verificationCode as digit, index}
								<Input
									id="code-{index}"
									type="text"
									bind:value={verificationCode[index]}
									class="w-12 h-12 text-center text-lg font-mono tracking-widest"
									maxlength={1}
									disabled={isSubmitting}
									oninput={(e: any) => handleCodeInput(index, e)}
									onkeydown={(e: any) => handleKeydown(index, e)}
									onpaste={(e: any) => handlePaste(e)}
								/>
							{/each}
						</div>
					</div>

					<Button
						type="submit"
						class="w-full h-10"
						disabled={fullVerificationCode.length !== 6 || isSubmitting}
					>
						{#if isSubmitting}
							<RefreshCwIcon class="w-4 h-4 mr-2 animate-spin" />
							Verifying...
						{:else}
							Verify Email
						{/if}
					</Button>
				</form>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<span class="w-full border-t"></span>
					</div>
					<div class="relative flex justify-center text-xs uppercase">
						<span class="bg-background px-2 text-muted-foreground">Or</span>
					</div>
				</div>

				<div class="text-center space-y-2">
					<p class="text-sm text-muted-foreground">
						Didn't receive the email?
					</p>
					<Button
						variant="outline"
						size="sm"
						onclick={handleResend}
						disabled={isResending || countdown > 0}
					>
						{#if isResending}
							<RefreshCwIcon class="w-4 h-4 mr-2 animate-spin" />
							Sending...
						{:else if countdown > 0}
							Resend in {countdown}s
						{:else}
							<MailIcon class="w-4 h-4 mr-2" />
							Resend verification email
						{/if}
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>