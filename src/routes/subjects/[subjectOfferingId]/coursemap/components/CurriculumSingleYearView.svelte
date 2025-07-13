<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Plus from 'lucide-svelte/icons/plus';
	import Calendar from 'lucide-svelte/icons/calendar';
	import CourseMapItemTableCell from './CourseMapItemTableCell.svelte';
	import type { CourseMapItem } from '$lib/server/db/schema';

	// Use Svelte 5 $props() for component props
	let {
		courseMapItems,
		yearLevel,
		onCourseMapItemClick,
		onEmptyCellClick
	}: {
		courseMapItems: CourseMapItem[];
		yearLevel: string;
		onCourseMapItemClick: (item: CourseMapItem) => void;
		onEmptyCellClick: (week: number, term: number) => void;
	} = $props();

	// Use Svelte 5 $derived for reactive computations
	const courseMapItemsBySemester = $derived(courseMapItems.reduce((acc, item) => {
		const semester = item.semester || 1;
		if (!acc[semester]) {
			acc[semester] = [];
		}
		acc[semester].push(item);
		return acc;
	}, {} as Record<number, CourseMapItem[]>));

	function handleAddItem(semester: number, weekNum: number) {
		onEmptyCellClick(weekNum, semester);
	}

	function getItemsForSemesterWeek(semester: number, weekNum: number): CourseMapItem[] {
		const semesterItems = courseMapItemsBySemester[semester] || [];
		return semesterItems.filter(item => {
			const startWeek = item.startWeek || 1;
			const duration = item.duration || 1;
			const endWeek = startWeek + duration - 1;
			return weekNum >= startWeek && weekNum <= endWeek;
		});
	}

	function getItemPosition(item: CourseMapItem, weekNum: number): { isStart: boolean; isEnd: boolean; position: number } {
		const startWeek = item.startWeek || 1;
		const duration = item.duration || 1;
		const endWeek = startWeek + duration - 1;
		const isStart = weekNum === startWeek;
		const isEnd = weekNum === endWeek;
		const position = weekNum - startWeek;
		return { isStart, isEnd, position };
	}

	function calculateWeekLength(item: CourseMapItem, currentWeek: number): number {
		const startWeek = item.startWeek || 1;
		const duration = item.duration || 1;
		const endWeek = startWeek + duration - 1;
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
					{#each [1, 2] as semester}
						{@const semesterItems = courseMapItemsBySemester[semester] || []}
						{@const currentSemester = semester}
						
						<tr>
							<!-- Semester label -->
							<td class="text-xs font-medium text-muted-foreground p-2 border bg-muted/30">
								<div>
									<div class="font-medium">Semester {semester}</div>
									<div class="text-xs opacity-70">
										{semesterItems.length} items
									</div>
								</div>
							</td>

							<!-- Week columns -->
							{#each Array.from({length: 18}, (_, i) => i + 1) as weekNum}
								{@const weekItems = getItemsForSemesterWeek(currentSemester, weekNum)}
								
								<td class="relative h-80 border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
									{#if weekItems.length === 0}
										<!-- Empty week - clickable area with plus icon on hover -->
										<button
											type="button"
											class="absolute inset-0 flex items-center justify-center cursor-pointer group bg-transparent border-0 p-0 m-0"
											aria-label="Add item to week {weekNum} semester {currentSemester}"
											onclick={() => handleAddItem(currentSemester, weekNum)}
										>
											<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
												<Plus class="h-6 w-6 text-muted-foreground" />
											</span>
										</button>
									{:else}
										<!-- Show course map items -->
										{#each weekItems.slice(0, 1) as item, index}
											{@const position = getItemPosition(item, weekNum)}
											{#if position.isStart}
												<!-- Only render the widget at the start week -->
												<div class="absolute inset-0" style="padding: 1px;">
													{#key `${item.id}-${item.color}-${item.topic}`}
														<CourseMapItemTableCell 
															{item} 
															isStart={true}
															weekLength={calculateWeekLength(item, weekNum)}
															{onCourseMapItemClick}
														/>
													{/key}
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
	</div>
</div>