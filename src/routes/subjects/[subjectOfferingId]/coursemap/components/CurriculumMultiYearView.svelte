<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Plus from 'lucide-svelte/icons/plus';
	import GraduationCap from 'lucide-svelte/icons/graduation-cap';
	import CourseMapItemTableCell from './CourseMapItemTableCell.svelte';
	import { F10_YEAR_LEVELS, SEMESTERS } from '../curriculum-utils';
	import type { CourseMapItem } from '$lib/server/db/schema';

	export let courseMapItems: CourseMapItem[];
	export let onCourseMapItemClick: (item: CourseMapItem) => void;
	export let onEmptyCellClick: (week: number, term: number) => void;

	// Group course map items by year level and term
	$: courseMapItemsByYearAndTerm = courseMapItems.reduce((acc, item) => {
		if (!acc[item.yearLevel]) {
			acc[item.yearLevel] = {};
		}
		if (!acc[item.yearLevel][item.termNumber]) {
			acc[item.yearLevel][item.termNumber] = [];
		}
		acc[item.yearLevel][item.termNumber].push(item);
		return acc;
	}, {} as Record<string, Record<number, CourseMapItem[]>>);

	function handleAddItem(yearLevel: string, termNumber: number, weekNum: number) {
		onEmptyCellClick(weekNum, termNumber);
	}

	function getItemsForYearTermWeek(yearLevel: string, termNumber: number, weekNum: number): CourseMapItem[] {
		const yearItems = courseMapItemsByYearAndTerm[yearLevel];
		if (!yearItems) return [];
		
		const termItems = yearItems[termNumber] || [];
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
	<!-- F-10 Curriculum Map Grid -->
	<div class="w-full">
		<div class="mb-4">
			<h3 class="flex items-center gap-2 text-lg font-semibold">
				<GraduationCap class="h-5 w-5" />
				Foundation to Year 10 Overview
			</h3>
		</div>
		
		<div class="w-full overflow-x-auto">
			<table class="w-full border-collapse border border-border">
				<!-- Week headers -->
				<thead>
					<tr>
						<th class="w-24 text-xs font-medium text-muted-foreground p-2 border text-left bg-muted/30">
							Year Level
						</th>
						<th class="w-16 text-xs font-medium text-center p-1 border bg-muted/50">
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
					{#each F10_YEAR_LEVELS as yearLevel}
						{#each SEMESTERS as semester, semesterIndex}
							<tr>
								<!-- Year level label (only show on first semester row) -->
								{#if semesterIndex === 0}
									<td rowspan="2" class="text-xs font-medium text-muted-foreground p-2 border bg-muted/30 align-top">
										<div class="font-medium">{yearLevel.label}</div>
									</td>
								{/if}

								<!-- Semester label -->
								<td class="w-20 text-xs font-medium text-muted-foreground p-2 border bg-muted/20">
									<div>
										<div class="font-medium">{semester.name}</div>
										<div class="text-xs opacity-70">
											T{semester.terms.join(', ')}
										</div>
									</div>
								</td>

								<!-- Week columns -->
								{#each Array.from({length: 18}, (_, i) => i + 1) as weekNum}
									{@const weekItems = semester.terms.flatMap(termNum => getItemsForYearTermWeek(yearLevel.value, termNum, weekNum))}
									
									<td class="relative h-32 p-0 border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
										{#if weekItems.length === 0}
											<!-- Empty week - show add button on hover -->
											<Button
												variant="ghost"
												size="sm"
												class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity h-full w-full text-[10px] rounded-none"
												onclick={() => handleAddItem(yearLevel.value, semester.terms[0], weekNum)}
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
															{onCourseMapItemClick}
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
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>