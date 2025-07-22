<script>
	import {
		Table,
		TableHead,
		TableBody,
		TableCell,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { convertToFullName } from '$lib/utils.js';

	let { data } = $props();
</script>

<Table>
	<TableHeader>
		<TableRow>
			<TableHead>Student Name</TableHead>
		</TableRow>
	</TableHeader>
	<TableBody>
		{#each data.students as student}
			<TableRow>
				<TableCell>
					{convertToFullName(student.firstName, student.middleName, student.lastName)}
				</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>
