<script>
	import Button from '$lib/components/ui/button/button.svelte';
</script>

<div class="flex justify-center py-24 lg:py-32">
	<div class="grid gap-4 md:grid-cols-2 md:items-center md:gap-8 xl:gap-20">
		<div>
			<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
				Openly evolving education
			</h1>
			<p class="text-muted-foreground mt-6 text-xl">
				with a learning management system that <strong>anyone</strong> can use.
			</p>
			<div class="mt-8 grid w-full gap-3 sm:inline-flex">
				<Button variant="secondary" size="lg">Watch the demo</Button>
				<Button variant="default" size="lg">Get started</Button>
			</div>
		</div>
		<div class="relative ms-4">
			<img
				class="h-auto max-w-xl rounded-lg shadow-xl dark:shadow-gray-800"
				src="/clay-students.jpeg"
				alt="Students using laptops"
			/>
		</div>
	</div>
</div>
