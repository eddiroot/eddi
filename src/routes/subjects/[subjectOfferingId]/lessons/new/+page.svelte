<script lang="ts">
	import CreateLessonForm from './form.svelte';

	let { data } = $props();
</script>

<div class="flex h-full w-full items-center justify-center p-8">
	<div class="flex flex-col gap-2">
		<div>
			<h1 class="mb-2 text-3xl font-bold">Create New Lesson</h1>
			<p class="mb-4 max-w-3xl">
				Create an engaging lesson, homework task or assessment with interactive content and
				multimedia.
			</p>
		</div>
		<CreateLessonForm {data} />
	</div>
</div>
