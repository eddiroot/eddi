<!-- +page.svelte -->
<script lang="ts">
	import Form from './form.svelte';

	let { data } = $props();
</script>

<Form {data} />
