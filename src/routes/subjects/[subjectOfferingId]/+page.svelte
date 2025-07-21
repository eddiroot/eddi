<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { formatTimestampAsTime, days } from '$lib/utils.js';

	let { data } = $props();

	const assessments = [
		{ name: 'Test 1 - Functions and Relations', dueDate: '2025-07-15', type: 'Test' },
		{ name: 'SAC 1 - Calculus Application', dueDate: '2025-07-22', type: 'SAC' }
	];

	const resources = [
		{ title: 'PowerPoint on imaginary numbers week 3', type: 'Presentation' },
		{ title: 'Textbook - linear algebra textbook', type: 'PDF' },
		{ title: 'Video on calculus applications', type: 'Video' },
		{ title: 'Worksheet on functions', type: 'Worksheet' },
		{ title: 'Revision guide for SAC 1', type: 'Revision Guide' },
		{ title: 'Practice questions for Test 1', type: 'Practice Questions' },
		{ title: 'Online quiz on functions', type: 'Quiz' },
		{ title: 'Interactive graphing tool', type: 'Tool' },
		{ title: 'Forum discussion on calculus', type: 'Discussion' },
		{ title: 'Past exam papers', type: 'Exam Papers' }
	];

	// Create sorted array of user classes by day of week using derived rune
	const sortedUserClasses = $derived(() => {
		type UserClass = (typeof data.userClasses)[0];
		const classesByDay: UserClass[][] = [[], [], [], [], []];

		data.userClasses?.forEach((cls) => {
			const dayOfWeek = cls.classAllocation.startTimestamp.getDay();
			const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;

			if (dayIndex >= 0 && dayIndex < 5) {
				classesByDay[dayIndex].push(cls);
			}
		});

		return classesByDay;
	});
</script>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-foreground text-3xl font-bold">{data.subject?.name}</h1>
			<p class="text-muted-foreground mt-1">
				Teacher: {data.mainTeacher
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
						{#each assessments as assessment}
							<div class="border-border rounded-lg border p-3">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="text-foreground text-sm font-medium">{assessment.name}</h4>
										<Badge variant="secondary" class="mt-1 text-xs">
											{assessment.type}
										</Badge>
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
						{#each sortedUserClasses() as dayClasses, dayIndex}
							{#if dayClasses.length > 0}
								<div>
									<h4 class="text-foreground mb-2 font-medium">{days[dayIndex].name}</h4>
									<div class="space-y-1">
										{#each dayClasses as cls}
											<div class="border-border rounded-lg border p-3">
												<div class="flex items-center justify-between">
													<span class="text-muted-foreground text-sm"
														>{formatTimestampAsTime(cls.classAllocation.startTimestamp)} - {formatTimestampAsTime(
															cls.classAllocation.endTimestamp
														)}</span
													>
													<span class="text-muted-foreground text-sm">{cls.schoolSpace.name}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
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
						{#each resources as resource}
							<div class="border-border rounded-lg border p-3">
								<h4 class="text-foreground text-sm leading-tight font-medium">
									{resource.title}
								</h4>
								<Badge variant="outline" class="mt-2 text-xs">
									{resource.type}
								</Badge>
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
						{#each data.teachers as teacher}
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
