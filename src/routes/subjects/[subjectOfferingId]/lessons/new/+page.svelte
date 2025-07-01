<script lang="ts">
	import CreateLessonForm from './form.svelte';

	let { data } = $props();
</script>

<div class="p-8">
	<h1 class="mb-2 text-3xl font-bold">Create New Lesson</h1>
	<p class="mb-4 w-2/3">
		Create an engaging lesson, homework, assignment with interactive content, assessments, and multimedia resources.
	</p>
	<CreateLessonForm {data} />
</div>
