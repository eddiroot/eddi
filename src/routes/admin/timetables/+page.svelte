<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
</script>

<div class="space-y-4">
	<div class="flex justify-between">
		<h1 class="text-3xl font-bold tracking-tight">Timetables</h1>
		<form method="POST" action="?/createTimetable">
			<Button type="submit">
				<PlusIcon />
				Create New
			</Button>
		</form>
	</div>
	<ul>
		<li>Old Timetable 01</li>
		<li>Old Timetable 02</li>
		<li>Old Timetable 03</li>
	</ul>
</div>
