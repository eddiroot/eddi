<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import MailIcon from '@lucide/svelte/icons/mail';
	import SendIcon from '@lucide/svelte/icons/send';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight">Notify Teachers</h1>
		<Button variant="outline" href="/admin/interviews/overview">Back to Overview</Button>
	</div>
	{#if !data.config || !data.config.isActive}
		<Card.Root class="border-yellow-200 bg-yellow-50">
			<Card.Header>
				<div class="flex items-center gap-2">
					<MailIcon class="text-yellow-600" />
					<Card.Title class="text-yellow-800">Interviews Not Active</Card.Title>
				</div>
			</Card.Header>
			<Card.Content>
				<p class="text-yellow-700">
					You need to activate your interview configuration before sending notifications.
					<Button
						variant="link"
						href="/admin/interviews/overview"
						class="h-auto p-0 text-yellow-600 underline">Go to overview</Button
					>
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-3">
					<div class="bg-primary rounded-lg p-2">
						<MailIcon class="text-primary-foreground" />
					</div>
					<div class="flex-1">
						<Card.Title class="text-lg font-semibold">Notify Teachers</Card.Title>
					</div>
				</div>
				<Card.Description>
					Direct teachers to the interview system where they can set up their available time slots.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<form method="POST" class="space-y-4">
					<Button type="submit" name="action" value="notify_teachers" class="w-full">
						<SendIcon class="mr-2" />
						Open Teacher Interview Page
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
