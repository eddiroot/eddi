<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';

	interface Props {
		row: any;
	}

	const { row }: Props = $props();

	function handleEdit() {
		console.log('Edit user:', row.original);
	}

	function handleArchive() {
		console.log('Archive user:', row.original);
	}

	function handleViewProfile() {
		console.log('View profile:', row.original);
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="sm">
				<MoreHorizontalIcon class="h-4 w-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item onclick={handleEdit}>Edit</DropdownMenu.Item>
		<DropdownMenu.Item onclick={handleArchive}>Archive</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onclick={handleViewProfile}>View Profile</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
