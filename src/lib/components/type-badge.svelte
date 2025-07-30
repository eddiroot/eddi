<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';

	interface Props {
		type: string;
	}

	const { type }: Props = $props();

	const variant =
		type === 'teacher'
			? 'secondary'
			: type === 'student'
				? 'default'
				: type.toLowerCase().includes('admin')
					? 'destructive'
					: 'outline';
</script>

<Badge {variant} class="capitalize">{type}</Badge>
