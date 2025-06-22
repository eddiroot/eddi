<script lang="ts">
	import CreatePostForm from './form.svelte';

	let { data } = $props();
</script>

<div>
	<h1 class="mb-2 text-3xl font-bold">New Post</h1>
	<p class="mb-4">Share your thoughts, ask questions, or make announcements to your classmates.</p>
	<CreatePostForm {data} />
</div>
