<script>
	import {
		Table,
		TableHead,
		TableBody,
		TableCell,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';

	let { data } = $props();
</script>

<Table>
	<TableHeader>
		<TableRow>
			<TableHead>Subject Name</TableHead>
			<TableHead>YearLevel</TableHead>
		</TableRow>
	</TableHeader>
	<TableBody>
		{#each data.subjects as subject}
			<TableRow>
				<TableCell>
					{subject.name}
				</TableCell>
				<TableCell>
					{subject.yearLevel}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>
