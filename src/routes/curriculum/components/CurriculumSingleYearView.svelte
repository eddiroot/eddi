<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Plus, Calendar } from 'lucide-svelte';
	import CourseMapItemTableCell from './CourseMapItemTableCell.svelte';
	import { SEMESTERS } from '../curriculum-utils';
	import type { CourseMapItem,  } from '$lib/server/db/schema';

	export let courseMapItems: CourseMapItem[];
	export let yearLevel: string;
	export let showAddDialog: boolean;

	// Group course map items by semester and term
	$: courseMapItemsByTerm = courseMapItems.reduce((acc, item) => {
		if (!acc[item.termNumber]) {
			acc[item.termNumber] = [];
		}
		acc[item.termNumber].push(item);
		return acc;
	}, {} as Record<number, CourseMapItem[]>);

	function handleAddItem(termNumber: number, weekNum: number) {
		// You could pass specific term and week data to the add dialog
		showAddDialog = true;
	}

	function getItemsForTermWeek(termNumber: number, weekNum: number): CourseMapItem[] {
		const termItems = courseMapItemsByTerm[termNumber] || [];
		return termItems.filter(item => {
			const endWeek = item.startWeekNumber + item.lengthInWeeks - 1;
			return weekNum >= item.startWeekNumber && weekNum <= endWeek;
		});
	}

	function getItemPosition(item: CourseMapItem, weekNum: number): { isStart: boolean; isEnd: boolean; position: number } {
		const endWeek = item.startWeekNumber + item.lengthInWeeks - 1;
		const isStart = weekNum === item.startWeekNumber;
		const isEnd = weekNum === endWeek;
		const position = weekNum - item.startWeekNumber;
		return { isStart, isEnd, position };
	}

	function calculateWeekLength(item: CourseMapItem, currentWeek: number): number {
		const endWeek = item.startWeekNumber + item.lengthInWeeks - 1;
		const remainingWeeks = Math.min(endWeek - currentWeek + 1, 18 - currentWeek + 1);
		return remainingWeeks;
	}
</script>

<div class="w-full">
	<!-- Single Curriculum Map Grid -->
	<div class="w-full">
		<div class="mb-4">
			<h3 class="flex items-center gap-2 text-lg font-semibold">
				<Calendar class="h-5 w-5" />
				Year {yearLevel} Curriculum Map
			</h3>
		</div>
		
		<div class="w-full overflow-x-auto">
			<table class="w-full border-collapse border border-border">
				<!-- Week headers -->
				<thead>
					<tr>
						<th class="w-24 text-xs font-medium text-muted-foreground p-2 border text-left bg-muted/30">
							Semester
						</th>
						{#each Array.from({length: 18}, (_, i) => i + 1) as weekNum}
							<th class="w-16 text-xs font-medium text-center p-1 border bg-muted/50">
								{weekNum}
							</th>
						{/each}
					</tr>
				</thead>
				
				<tbody>
					<!-- Semester rows -->
					{#each SEMESTERS as semester}
						{@const semesterItems = semester.terms.flatMap(termNum => courseMapItemsByTerm[termNum] || [])}
						
						<tr>
							<!-- Semester label -->
							<td class="text-xs font-medium text-muted-foreground p-2 border bg-muted/30">
								<div>
									<div class="font-medium">{semester.name}</div>
									<div class="text-xs opacity-70">
										Terms {semester.terms.join(', ')}
									</div>
								</div>
							</td>

							<!-- Week columns -->
							{#each Array.from({length: 18}, (_, i) => i + 1) as weekNum}
								{@const weekItems = semester.terms.flatMap(termNum => getItemsForTermWeek(termNum, weekNum))}
								
								<td class="relative h-80 border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
									{#if weekItems.length === 0}
										<!-- Empty week - show add button on hover -->
										<Button
											variant="ghost"
											size="sm"
											class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity h-full w-full text-[10px] rounded-none"
											onclick={() => handleAddItem(semester.terms[0], weekNum)}
										>
											<Plus class="h-3 w-3" />
										</Button>
									{:else}
										<!-- Show course map items -->
										{#each weekItems.slice(0, 1) as item, index}
											{@const position = getItemPosition(item, weekNum)}
											{#if position.isStart}
												<!-- Only render the widget at the start week -->
												<div class="absolute inset-0" style="padding: 1px;">
													<CourseMapItemTableCell 
														{item} 
														isStart={true}
														weekLength={calculateWeekLength(item, weekNum)}
													/>
												</div>
											{/if}
										{/each}
										
										{#if weekItems.length > 1}
											<div class="absolute bottom-1 right-1 text-[8px] text-muted-foreground bg-background rounded px-1 z-20">
												+{weekItems.length - 1}
											</div>
										{/if}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		
		<!-- Summary -->
		{#if courseMapItems.length === 0}
			<div class="text-center py-8 text-muted-foreground">
				<Calendar class="h-8 w-8 mx-auto mb-2 opacity-50" />
				<p class="text-sm">No course map items for Year {yearLevel}</p>
				<Button 
					variant="outline" 
					size="sm" 
					class="mt-2"
					onclick={() => showAddDialog = true}
				>
					<Plus class="h-4 w-4 mr-2" />
					Add First Item
				</Button>
			</div>
		{/if}
	</div>
</div>
