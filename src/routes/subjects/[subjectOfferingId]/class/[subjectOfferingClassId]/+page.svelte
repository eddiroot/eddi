<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	let { data } = $props();

	// const sortedUserClasses = $derived(() => {
	// 	type UserClass = (typeof data.userClasses)[0];
	// 	const classesByDay: UserClass[][] = [[], [], [], [], []]; // Array for Mon-Fri (5 days)

	// 	data.userClasses?.forEach((cls) => {
	// 		const dayIndex = getDayIndex(cls.classAllocation.dayOfWeek);
	// 		if (dayIndex !== -1) {
	// 			classesByDay[dayIndex].push(cls);
	// 		}
	// 	});

	// 	// Sort classes within each day by start time
	// 	classesByDay.forEach((dayClasses) => {
	// 		dayClasses.sort((a, b) =>
	// 			a.classAllocation.startTime.localeCompare(b.classAllocation.startTime)
	// 		);
	// 	});

	// 	return classesByDay;
	// });
</script>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-foreground text-3xl font-bold">Placeholder Name</h1>
			<p class="text-muted-foreground mt-1">
				Teacher: {data.thisSubjectOfferingTeachers
					.map((teacher) => `${teacher.teacher.firstName} ${teacher.teacher.lastName}`)
					.join(', ')}
			</p>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
		<!-- Overview Section (Full Width) -->
		<div class="xl:col-span-4">
			<Card.Root class="shadow-none">
				<Card.Header>
					<Card.Title class="text-xl">Overview</Card.Title>
				</Card.Header>
			</Card.Root>
		</div>

		<!-- Assessments -->
		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Assessments</Card.Title>
			</Card.Header>
			<Card.Content>
				<ScrollArea class="h-100">
					<div class="space-y-2 pr-4">
						{#each data.assessments as assessment}
							<div class="border-border rounded-lg border p-3">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="text-foreground text-sm font-medium">{assessment.task.title}</h4>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>

		<!-- Classes -->
		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Classes</Card.Title>
			</Card.Header>
			<Card.Content>
				<ScrollArea class="h-100">
					<div class="space-y-2 pr-4">
						<!-- {#each sortedUserClasses() as dayClasses, dayIndex}
							{#if dayClasses.length > 0}
								<div>
									<h4 class="text-foreground mb-2 font-medium">{days[dayIndex].name}</h4>
									<div class="space-y-1">
										{#each dayClasses as cls}
											<div class="border-border rounded-lg border p-3">
												<div class="flex items-center justify-between">
													<span class="text-muted-foreground text-sm"
														>{formatTime(cls.classAllocation.startTime)} - {formatTime(
															addTimeAndDuration(
																cls.classAllocation.startTime,
																cls.classAllocation.duration
															)
														)}</span
													>
													<span class="text-muted-foreground text-sm"
														>{cls.schoolSpace.name}</span
													>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/each} -->
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>

		<!-- Resources -->
		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Resources</Card.Title>
			</Card.Header>
			<Card.Content>
				<ScrollArea class="h-100">
					<div class="space-y-2 pr-4">
						{#each data.resources as resource}
							<div class="border-border rounded-lg border p-3">
								<h4 class="text-foreground text-sm leading-tight font-medium">
									resourse name placeholder
								</h4>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>

		<!-- Contact Information -->
		<Card.Root class="shadow-none">
			<Card.Header>
				<Card.Title class="text-lg">Contacts</Card.Title>
			</Card.Header>
			<Card.Content>
				<ScrollArea class="h-100">
					<div class="space-y-2">
						{#each data.thisSubjectOfferingTeachers as teacher}
							<div class="border-border rounded-lg border p-3">
								<h4 class="text-foreground text-sm font-medium">
									{teacher.teacher.firstName}
									{teacher.teacher.lastName}
								</h4>
								<p class="text-muted-foreground mt-1 text-sm">
									{teacher.teacher.email}
								</p>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>
	</div>
</div>
