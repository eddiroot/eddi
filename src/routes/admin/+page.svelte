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
	import UserRoundCogIcon from '@lucide/svelte/icons/user-round-cog';

	const { data } = $props();

	const adminSections = [
		{
			title: 'School Details',
			description: "Configure your school's name, logo, branding, and theme settings",
			icon: SchoolIcon,
			href: '/admin/school'
		},
		{
			title: 'Campuses',
			description: 'Manage campus locations, contact information, and physical addresses',
			icon: BuildingIcon,
			href: '/admin/campuses'
		},
		{
			title: 'Locations',
			description: 'Configure learning spaces, classrooms, and facilities within each campus',
			icon: MapPinIcon,
			href: '/admin/locations'
		},
		{
			title: 'Users',
			description: 'Manage user accounts for students, staff, guardians, and administrators',
			icon: UsersIcon,
			href: '/admin/users'
		},
		{
			title: 'Subjects',
			description: 'Define the subjects that your school offers as well as their descriptions',
			icon: BookOpenIcon,
			href: '/admin/subjects'
		},
		{
			title: 'Timetables',
			description: 'Set up school periods, schedules, and generate class timetables',
			icon: CalendarDaysIcon,
			href: '/admin/timetables'
		},
		{
			title: 'Allocations',
			description: 'Assign students and teachers to classes and manage enrollments',
			icon: ContactIcon,
			href: '/admin/allocations'
		}
	];

	const stats = [
		{
			title: 'Total Students',
			value: data.stats.totalStudents,
			icon: UsersIcon
		},
		{
			title: 'Total Teachers',
			value: data.stats.totalTeachers,
			icon: GraduationCapIcon
		},
		{
			title: 'Total Admins',
			value: data.stats.totalAdmins,
			icon: UserRoundCogIcon
		},
		{
			title: 'Total Subjects',
			value: data.stats.totalSubjects,
			icon: BookOpenIcon
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
									<section.icon class="text-secondary-foreground" />
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
			{#each stats as stat}
				<Card.Root>
					<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
						<Card.Title class="text-muted-foreground text-sm font-medium">{stat.title}</Card.Title>
						<stat.icon class="text-muted-foreground h-4 w-4" />
					</Card.Header>
					<Card.Content>
						<p class="text-2xl font-bold">{stat.value}</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
</div>
