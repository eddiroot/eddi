<script lang="ts">
	import CreatePostForm from './form.svelte';

	let { data } = $props();
</script>

<div>
	<h1 class="mb-4 text-3xl font-bold">New Post</h1>
	<CreatePostForm {data} />
</div>
