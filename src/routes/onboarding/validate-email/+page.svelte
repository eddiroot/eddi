<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import MailIcon from '@lucide/svelte/icons/mail';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import { page } from '$app/stores';
	let verificationCode = '';
	let isResending = false;
	let countdown = 0;
	let isSubmitting = false;

	// Get the full verification code as string
	$: fullVerificationCode = verificationCode;

	// Server error from action
	$: serverError = $page.form?.error;

	function setCountdown(n: number) {
		countdown = n;
	}

	// Handle resend form submission for UI feedback
	async function onResendSubmit() {
		isResending = true;
		setCountdown(60);
		const timer = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(timer);
				isResending = false;
			}
		}, 1000);
	}
</script>

<div class="bg-background flex min-h-screen items-center justify-center p-4">
	<div class="mx-auto w-full max-w-md">
		<Card class="border-none shadow-none">
			<CardHeader class="text-center">
				<div
					class="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
				>
					<MailIcon class="text-primary h-6 w-6" />
				</div>
				<CardTitle class="text-2xl">Verify your email</CardTitle>
				<CardDescription>
					We've sent a 6-digit verification code to your email address. Please enter it below.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<form method="POST" action="?/verify" use:enhance class="space-y-4">
					{#if serverError}
						<div class="text-red-500 text-center text-sm font-medium">{serverError}</div>
					{/if}
					<div class="flex justify-center">
						<InputOTP.Root bind:value={verificationCode} maxlength={6}>
							{#snippet children({ cells })}
								<InputOTP.Group>
									{#each cells as cell}
										<InputOTP.Slot {cell} />
									{/each}
								</InputOTP.Group>
							{/snippet}
						</InputOTP.Root>
					</div>
					<!-- Hidden input for full code -->
					<input type="hidden" name="code" value={fullVerificationCode} />
					<Button
						type="submit"
						class="h-10 w-full"
						disabled={fullVerificationCode.length !== 6 || isSubmitting}
					>
						{#if isSubmitting}
							<RefreshCwIcon class="mr-2 h-4 w-4 animate-spin" />
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
						<span class="bg-background text-muted-foreground px-2">Or</span>
					</div>
				</div>
				<div class="space-y-2 text-center">
					<p class="text-muted-foreground text-sm">Didn't receive the email?</p>
					<form method="POST" action="?/resend" use:enhance on:submit={onResendSubmit}>
						<Button
							variant="outline"
							size="sm"
							disabled={isResending || countdown > 0}
							type="submit"
						>
							{#if isResending}
								<RefreshCwIcon class="mr-2 h-4 w-4 animate-spin" />
								Sending...
							{:else if countdown > 0}
								Resend in {countdown}s
							{:else}
								<MailIcon class="mr-2 h-4 w-4" />
								Resend verification email
							{/if}
						</Button>
					</form>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
