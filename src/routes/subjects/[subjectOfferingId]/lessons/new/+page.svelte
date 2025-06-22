<script lang="ts">
	import CreateLessonForm from './form.svelte';

	let { data } = $props();
</script>

<div>
	<h1 class="mb-2 text-3xl font-bold">Create New Lesson</h1>
	<p class="mb-4">
		Create an engaging lesson with interactive content, assessments, and multimedia resources.
	</p>
	<CreateLessonForm {data} />
</div>
