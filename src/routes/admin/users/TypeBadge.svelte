<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';

	interface Props {
		type: string;
	}

	const { type }: Props = $props();

	const variant = type === 'teacher' ? 'default' : type === 'student' ? 'secondary' : 'outline';
</script>

<Badge {variant} class="capitalize">{type}</Badge>
