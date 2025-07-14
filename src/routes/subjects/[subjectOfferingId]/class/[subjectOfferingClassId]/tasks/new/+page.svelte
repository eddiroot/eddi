<script lang="ts">
	import CreateTaskForm from './form.svelte';

	let { data } = $props();
</script>

<div class="w-full min-h-screen p-8">
	<div class="max-w-3xl mx-auto">
		<CreateTaskForm {data} />
	</div>
</div>
