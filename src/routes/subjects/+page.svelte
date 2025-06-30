<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	// Mock data - replace with actual data prop when available
	const subjects = [
		{
			id: '1',
			name: 'Mathematics Methods 1/2',
			description: 'Advanced mathematical concepts including calculus, algebra, and functions.',
			teacher: 'Mr. Smith',
			nextClass: { day: 'Monday', time: '09:00', room: 'M101' },
			upcomingAssessments: 2,
			color: 'bg-blue-100 border-blue-300 text-blue-900'
		},
		{
			id: '2',
			name: 'English Language 3/4',
			description: 'Comprehensive study of English language structure, usage, and analysis.',
			teacher: 'Ms. Johnson',
			nextClass: { day: 'Tuesday', time: '11:00', room: 'E205' },
			upcomingAssessments: 1,
			color: 'bg-red-100 border-red-300 text-red-900'
		},
		{
			id: '3',
			name: 'Chemistry 1/2',
			description: 'Fundamental principles of chemistry including atomic structure and reactions.',
			teacher: 'Dr. Wilson',
			nextClass: { day: 'Wednesday', time: '13:30', room: 'S102' },
			upcomingAssessments: 3,
			color: 'bg-green-100 border-green-300 text-green-900'
		},
		{
			id: '4',
			name: 'History: Revolutions 3/4',
			description: 'Study of major historical revolutions and their impact on society.',
			teacher: 'Mr. Brown',
			nextClass: { day: 'Thursday', time: '10:30', room: 'H301' },
			upcomingAssessments: 1,
			color: 'bg-amber-100 border-amber-300 text-amber-900'
		},
		{
			id: '5',
			name: 'Geography 1/2',
			description: 'Physical and human geography with focus on environmental systems.',
			teacher: 'Ms. Davis',
			nextClass: { day: 'Friday', time: '14:00', room: 'G201' },
			upcomingAssessments: 0,
			color: 'bg-purple-100 border-purple-300 text-purple-900'
		}
	];
</script>

<div class="p-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-foreground text-3xl font-bold">My Subjects (TODO)</h1>
		<p class="text-muted-foreground mt-2">
			View and manage all your enrolled subjects for this semester.
		</p>
	</div>

	<!-- Subjects Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each subjects as subject}
			<a href="/subjects/{subject.id}/home" class="hover:bg-muted/50 block transition-colors">
				<Card.Root class="h-full shadow-none {subject.color}">
					<Card.Header>
						<div class="flex items-start justify-between">
							<Card.Title class="text-lg leading-tight">{subject.name}</Card.Title>
							{#if subject.upcomingAssessments > 0}
								<Badge variant="destructive" class="text-xs">
									{subject.upcomingAssessments} due
								</Badge>
							{/if}
						</div>
						<Card.Description class="text-sm">
							{subject.description}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<!-- Teacher -->
							<div class="flex items-center gap-2">
								<span class="text-muted-foreground text-sm">Teacher:</span>
								<span class="text-foreground text-sm font-medium">{subject.teacher}</span>
							</div>

							<!-- Next Class -->
							<div class="flex items-center gap-2">
								<span class="text-muted-foreground text-sm">Next class:</span>
								<span class="text-foreground text-sm font-medium">
									{subject.nextClass.day}
									{subject.nextClass.time} • {subject.nextClass.room}
								</span>
							</div>
						</div>
					</Card.Content>
					<Card.Footer class="pt-0">
						<Button variant="ghost" size="sm" class="w-full">View Subject →</Button>
					</Card.Footer>
				</Card.Root>
			</a>
		{/each}
	</div>

	<!-- Empty State (if no subjects) -->
	{#if subjects.length === 0}
		<div class="flex flex-col items-center justify-center py-16">
			<div class="bg-muted/50 mb-4 rounded-full p-6">
				<span class="text-4xl">📚</span>
			</div>
			<h3 class="text-foreground mb-2 text-lg font-semibold">No subjects enrolled</h3>
			<p class="text-muted-foreground mb-4 text-center">
				You haven't enrolled in any subjects yet. Contact your academic advisor for assistance.
			</p>
			<Button variant="outline">Contact Support</Button>
		</div>
	{/if}
</div>
