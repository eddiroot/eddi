<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { generateSubjectColors } from '../timetable/utils';

	let { data } = $props();
</script>

<div class="p-8">
	<div class="mb-8">
		<h1 class="text-foreground text-3xl font-bold">My Subjects</h1>
		<p class="text-muted-foreground mt-2">
			View and manage all your enrolled subjects for this semester.
		</p>
	</div>

	<!-- Subjects Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each data.info as subjectInfo}
			{@const colors = generateSubjectColors(subjectInfo.subject.userSubjectOffering.color)}
			<a href="/subjects/{subjectInfo.subject.subjectOffering.id}" class="block">
				<Card.Root
					class="h-full border-t-5 shadow-lg transition-opacity duration-200 hover:opacity-70"
					style="border-top-color: {colors.borderTop};"
				>
					<Card.Header>
						<div class="flex items-start justify-between">
							<Card.Title class="text-lg leading-tight"
								>{subjectInfo.subject.subject.name}</Card.Title
							>
							<!-- {#if subject.upcomingAssessments > 0}
								<Badge variant="destructive" class="text-xs">
									{subject.upcomingAssessments} due
								</Badge>
							{/if} -->
						</div>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<!-- Teacher -->
							<div class="flex items-center gap-2">
								<span class="text-muted-foreground text-sm">Teacher:</span>
								<span class="text-foreground text-sm font-medium">
									{subjectInfo.teacher
										.map((teacher) => `${teacher.teacher.firstName} ${teacher.teacher.lastName}`)
										.join(', ')}
								</span>
							</div>

							<!-- Next Class -->
							<div class="flex items-center gap-2">
								<span class="text-muted-foreground text-sm">Next class:</span>
								<span class="text-foreground text-sm font-medium"> Monday 9:25am • Room 102 </span>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</a>
		{/each}
	</div>

	{#if data.subjects.length === 0}
		<div class="flex flex-col items-center justify-center py-16">
			<div class="bg-muted/50 mb-4 rounded-full p-6">
				<span class="text-4xl">📚</span>
			</div>
			<h3 class="text-foreground mb-2 text-lg font-semibold">No subjects available</h3>
			<p class="text-muted-foreground mb-4 text-center">
				You haven't been assigned any subjects yet. Please contact your school admin team for
				assistance.
			</p>
		</div>
	{/if}
</div>
