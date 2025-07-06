<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import SchoolIcon from '@lucide/svelte/icons/school';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ContactIcon from '@lucide/svelte/icons/contact';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import ClockIcon from '@lucide/svelte/icons/clock';

	const adminSections = [
		{
			title: 'Allocations',
			description: 'Allocate students and staff to campuses and subjects',
			icon: ContactIcon,
			href: '/admin/campuses'
		},
		{
			title: 'Campuses',
			description: 'Manage school campuses and locations',
			icon: BuildingIcon,
			href: '/admin/campuses'
		},
		{
			title: 'Locations',
			description: 'Manage rooms and teaching spaces',
			icon: MapPinIcon,
			href: '/admin/locations'
		},
		{
			title: 'School',
			description: 'Configure school information and settings',
			icon: SchoolIcon,
			href: '/admin/school'
		},
		{
			title: 'Subjects',
			description: 'Manage subjects and curriculum',
			icon: BookOpenIcon,
			href: '/admin/subjects'
		},
		{
			title: 'Timetables',
			description: 'Configure class schedules and periods',
			icon: CalendarDaysIcon,
			href: '/admin/timetables'
		},
		{
			title: 'Users',
			description: 'Manage teachers, students and staff',
			icon: UsersIcon,
			href: '/admin/users'
		}
	];

	const quickStats = [
		{
			title: 'Total Students',
			value: '1024',
			icon: UsersIcon
		},
		{
			title: 'Total Staff',
			value: '512',
			icon: GraduationCapIcon
		},
		{
			title: 'Subjects',
			value: '34',
			icon: BookOpenIcon
		},
		{
			title: 'Classes Today',
			value: '156',
			icon: ClockIcon
		}
	];
</script>

<div class="space-y-8">
	<h1 class="text-3xl font-bold tracking-tight">Admin</h1>

	<!-- Admin Sections -->
	<div class="space-y-4">
		<h2 class="text-2xl font-semibold tracking-tight">Functions</h2>
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each adminSections as section}
				<a href={section.href} class="block">
					<Card.Root class="h-40">
						<Card.Header class="gap-4">
							<div class="flex items-center gap-3">
								<div class="bg-secondary rounded-lg p-2">
									<svelte:component this={section.icon} class="text-secondary-foreground" />
								</div>
								<div class="flex-1">
									<Card.Title class="text-lg font-semibold">{section.title}</Card.Title>
								</div>
							</div>
							<Card.Description>{section.description}</Card.Description>
						</Card.Header>
					</Card.Root>
				</a>
			{/each}
		</div>
	</div>

	<!-- Quick Stats Section -->
	<div class="space-y-4">
		<h2 class="text-2xl font-semibold tracking-tight">Stats</h2>
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#each quickStats as stat}
				<Card.Root>
					<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
						<Card.Title class="text-muted-foreground text-sm font-medium">{stat.title}</Card.Title>
						<svelte:component this={stat.icon} class="text-muted-foreground h-4 w-4" />
					</Card.Header>
					<Card.Content>
						<p class="text-2xl font-bold">{stat.value}</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
</div>
