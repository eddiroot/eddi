<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import SchoolIcon from '@lucide/svelte/icons/school';
	import SchoolForm from './form.svelte';

	const { data } = $props();
</script>

<div class="space-y-8">
	<div class="flex items-center gap-3">
		<div class="bg-primary/10 rounded-lg p-3">
			<SchoolIcon class="text-primary h-6 w-6" />
		</div>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">School Details</h1>
			<p class="text-muted-foreground">Configure your school's basic information and settings</p>
		</div>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Basic Information</Card.Title>
			<Card.Description>
				Update your school's name and email domain. These details will be used throughout the
				system.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<SchoolForm {data} />
		</Card.Content>
	</Card.Root>
</div>
