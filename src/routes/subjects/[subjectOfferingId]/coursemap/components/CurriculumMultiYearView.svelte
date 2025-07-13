<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import CourseMapItemTableCell from './CourseMapItemTableCell.svelte';
	import { F10_YEAR_LEVELS, SEMESTERS } from '../curriculum-utils';
	import type { CourseMapItem } from '$lib/server/db/schema';

	export let courseMapItems: CourseMapItem[];
	export let onCourseMapItemClick: (item: CourseMapItem) => void;
	export let onEmptyCellClick: (week: number, term: number) => void;

	// Group course map items by year level and term
	$: courseMapItemsByYearAndTerm = courseMapItems.reduce(
		(acc, item) => {
			if (!acc[item.yearLevel]) {
				acc[item.yearLevel] = {};
			}
			if (!acc[item.yearLevel][item.termNumber]) {
				acc[item.yearLevel][item.termNumber] = [];
			}
			acc[item.yearLevel][item.termNumber].push(item);
			return acc;
		},
		{} as Record<string, Record<number, CourseMapItem[]>>
	);

	function handleAddItem(yearLevel: string, termNumber: number, weekNum: number) {
		onEmptyCellClick(weekNum, termNumber);
	}

	function getItemsForYearTermWeek(
		yearLevel: string,
		termNumber: number,
		weekNum: number
	): CourseMapItem[] {
		const yearItems = courseMapItemsByYearAndTerm[yearLevel];
		if (!yearItems) return [];

		const termItems = yearItems[termNumber] || [];
		return termItems.filter((item) => {
			const endWeek = item.startWeekNumber + item.lengthInWeeks - 1;
			return weekNum >= item.startWeekNumber && weekNum <= endWeek;
		});
	}

	function getItemPosition(
		item: CourseMapItem,
		weekNum: number
	): { isStart: boolean; isEnd: boolean; position: number } {
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
			<table class="border-border w-full border-collapse border">
				<!-- Week headers -->
				<thead>
					<tr>
						<th
							class="text-muted-foreground bg-muted/30 w-24 border p-2 text-left text-xs font-medium"
						>
							Year Level
						</th>
						<th class="bg-muted/50 w-16 border p-1 text-center text-xs font-medium"> Semester </th>
						{#each Array.from({ length: 18 }, (_, i) => i + 1) as weekNum}
							<th class="bg-muted/50 w-16 border p-1 text-center text-xs font-medium">
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
									<td
										rowspan="2"
										class="text-muted-foreground bg-muted/30 border p-2 align-top text-xs font-medium"
									>
										<div class="font-medium">{yearLevel.label}</div>
									</td>
								{/if}

								<!-- Semester label -->
								<td class="text-muted-foreground bg-muted/20 w-20 border p-2 text-xs font-medium">
									<div>
										<div class="font-medium">{semester.name}</div>
										<div class="text-xs opacity-70">
											T{semester.terms.join(', ')}
										</div>
									</div>
								</td>

								<!-- Week columns -->
								{#each Array.from({ length: 18 }, (_, i) => i + 1) as weekNum}
									{@const weekItems = semester.terms.flatMap((termNum) =>
										getItemsForYearTermWeek(yearLevel.value, termNum, weekNum)
									)}

									<td
										class="border-border/50 bg-muted/20 hover:bg-muted/40 relative h-32 border p-0 transition-colors"
									>
										{#if weekItems.length === 0}
											<!-- Empty week - show add button on hover -->
											<Button
												variant="ghost"
												size="sm"
												class="absolute inset-0 h-full w-full rounded-none text-[10px] opacity-0 transition-opacity hover:opacity-100"
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
												<div
													class="text-muted-foreground bg-background absolute right-1 bottom-1 z-20 rounded px-1 text-[8px]"
												>
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
