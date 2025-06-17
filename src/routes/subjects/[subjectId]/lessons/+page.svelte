<script>
	import Title from '$lib/components/lesson/title.svelte';
	import Heading from '$lib/components/lesson/heading.svelte';
	import Paragraph from '$lib/components/lesson/paragraph.svelte';
</script>

<div class="flex flex-col gap-4">
	<Title />
	<Heading headingSize={1} text="This is a level 1 heading" />
	<Paragraph />
</div>
<h1 class="mb-4 p-8 text-3xl font-bold">Lessons</h1>
