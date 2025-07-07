<script lang="ts">
	import SchoolForm from './form.svelte';

	const { data } = $props();
</script>

<div class="space-y-8">
	<h1 class="text-3xl font-bold tracking-tight">School</h1>
	<SchoolForm {data} />
</div>
