<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	interface Props {
		value: string | undefined;
		onValueChange: (value: string | undefined) => void;
	}

	const { value, onValueChange }: Props = $props();

	const userTypes = [
		{ value: 'student', label: 'Student' },
		{ value: 'teacher', label: 'Teacher' },
		{ value: 'principal', label: 'Principal' },
		{ value: 'schoolAdmin', label: 'School Admin' }
	];

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

	const selectedLabel = $derived(userTypes.find((type) => type.value === value)?.label || 'Type');
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" class="px-0 has-[>svg]:px-0">
				{selectedLabel}
				<ChevronDownIcon class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start">
		{#each userTypes as userType}
			<DropdownMenu.CheckboxItem
				checked={value === userType.value}
				onCheckedChange={() => handleSelect(userType.value)}
			>
				{userType.label}
			</DropdownMenu.CheckboxItem>
		{/each}
		{#if value}
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={clearFilter}>Clear filter</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
