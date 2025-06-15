<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import CreatePostForm from './create-post-form.svelte';

	let { data } = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>New Post</Card.Title>
		<Card.Description>
			Share your thoughts, ask questions, or make announcements to your classmates.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<CreatePostForm {data} />
	</Card.Content>
</Card.Root>
