<script>
	import Title from '$lib/components/lesson/title.svelte';
	import Heading from '$lib/components/lesson/heading.svelte';
	import Paragraph from '$lib/components/lesson/paragraph.svelte';
</script>

<div class="flex flex-col gap-4">
	<Title />
	<Heading headingSize={1} text="This is a level 1 heading" />
	<Heading headingSize={2} text="This is a level 2 heading" />
	<Heading headingSize={3} text="This is a level 3 heading" />
	<Heading headingSize={4} text="This is a level 4 heading" />
	<Heading headingSize={5} text="This is a level 5 heading" />
	<Heading headingSize={6} text="This is a level 6 heading" />
	<Paragraph />
</div>
<h1 class="mb-4 p-8 text-3xl font-bold">Lessons</h1>
