<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import SchoolForm from './form.svelte';

	const { data } = $props();
</script>

<div class="space-y-8">
	<h1 class="text-3xl font-bold tracking-tight">School Details</h1>

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
