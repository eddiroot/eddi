<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	interface Props {
		locationTypes: string[];
		value: string | undefined;
		onValueChange: (value: string | undefined) => void;
	}

	const { value, onValueChange, locationTypes }: Props = $props();

	function handleSelect(selectedValue: string) {
		if (value === selectedValue) {
			// If the same value is selected, clear the filter
			onValueChange(undefined);
		} else {
			onValueChange(selectedValue);
		}
	}

	function clearFilter() {
		onValueChange(undefined);
	}

	const selectedLabel = $derived(locationTypes.find((type) => type === value) || 'Type');
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" class="px-0 capitalize has-[>svg]:px-0">
				{selectedLabel}
				<ChevronDownIcon class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start">
		{#each locationTypes as locationType}
			<DropdownMenu.CheckboxItem
				class="capitalize"
				checked={value === locationType}
				onCheckedChange={() => handleSelect(locationType)}
			>
				{locationType}
			</DropdownMenu.CheckboxItem>
		{/each}
		{#if value}
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={clearFilter}>Clear filter</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
