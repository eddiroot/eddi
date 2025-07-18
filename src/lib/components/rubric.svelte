<script lang="ts">
	interface RubricData {
		rubric: {
			id: number;
			title: string;
			description?: string | null;
		};
		rows: Array<{
			row: {
				id: number;
				title: string;
			};
			cells: Array<{
				id: number;
				level: 'exemplary' | 'accomplished' | 'developing' | 'beginning';
				description: string;
				marks: number;
			}>;
		}>;
	}

	let { rubricData }: { rubricData: RubricData } = $props();
</script>

<div class="bg-background border rounded-lg overflow-hidden shadow-sm">
	<!-- Rubric Header -->
	<div class="p-6 bg-muted/30 border-b">
		<h3 class="font-bold text-xl">{rubricData.rubric.title}</h3>
		{#if rubricData.rubric.description}
			<p class="text-sm text-muted-foreground mt-2">{rubricData.rubric.description}</p>
		{/if}
	</div>

	<!-- Rubric Content -->
	<div class="p-6">
		<!-- Performance Level Headers -->
		<div class="grid grid-cols-5 gap-4 mb-6 p-3 bg-muted/50 rounded-lg border">
			<div class="font-semibold text-sm">Rubric Criteria</div>
			<div class="text-center font-semibold text-sm">Exemplary</div>
			<div class="text-center font-semibold text-sm">Accomplished</div>
			<div class="text-center font-semibold text-sm">Developing</div>
			<div class="text-center font-semibold text-sm">Beginning</div>
		</div>

		<!-- Rubric Rows -->
		<div class="space-y-4">
			{#each rubricData.rows as { row, cells }}
				<div class="grid grid-cols-5 gap-4">
					<!-- Criteria Title -->
					<div class="flex items-center justify-center p-3 bg-muted/30 rounded-lg border font-medium text-sm text-center">
						{row.title}
					</div>
					
					<!-- Performance Level Cards -->
					{#each ['exemplary', 'accomplished', 'developing', 'beginning'] as level}
						{@const cell = cells.find(c => c.level === level)}
						<div class="border rounded-lg p-3 bg-card min-h-[100px]">
							{#if cell}
								<div class="space-y-2">
									<p class="text-sm text-muted-foreground leading-relaxed">
										{cell.description}
									</p>
									<div class="text-xs font-medium text-foreground/70 mt-2 pt-2 border-t">
										{cell.marks} {cell.marks === 1 ? 'mark' : 'marks'}
									</div>
								</div>
							{:else}
								<p class="text-sm text-muted-foreground italic text-center">
									Not defined
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
