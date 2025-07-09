<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import PiIcon from '@lucide/svelte/icons/pi';
	import BookOpenTextIcon from '@lucide/svelte/icons/book-open-text';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
	import BowArrowIcon from '@lucide/svelte/icons/bow-arrow';
	import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
	import BookOpenCheckIcon from '@lucide/svelte/icons/book-open-check';
	import MapIcon from '@lucide/svelte/icons/map';
	import FileQuestionIcon from '@lucide/svelte/icons/file-question';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import type { School, Campus, Subject, SubjectOffering } from '$lib/server/db/schema';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import { convertToFullName } from '$lib/utils';
	import HomeIcon from '@lucide/svelte/icons/home';
	import { page } from '$app/state';
	import OrbitIcon from '@lucide/svelte/icons/orbit';

	const items = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboardIcon,
			roles: ['any']
		},
		{
			title: 'Admin',
			url: '/admin',
			icon: WrenchIcon,
			roles: ['schoolAdmin']
		},

		{
			title: 'Timetable',
			url: '/timetable',
			icon: CalendarDaysIcon,
			roles: ['any']
		}
	];

	const subjectItems = [
		{
			title: 'Home',
			url: '',
			icon: HomeIcon
		},
		{
			title: 'Discussion',
			url: 'discussion',
			icon: MessagesSquareIcon
		},
		{
			title: 'Lessons',
			url: 'lessons',
			icon: BookOpenCheckIcon
		},
		{
			title: 'Analytics',
			url: 'analytics',
			icon: BarChart3Icon
		}
	];

	const subjectNameToIcon = (name: string) => {
		if (name.toLowerCase().includes('math')) {
			return PiIcon;
		}
		if (name.toLowerCase().includes('science')) {
			return FlaskConicalIcon;
		}
		if (name.toLowerCase().includes('physics')) {
			return OrbitIcon;
		}
		if (name.toLowerCase().includes('history')) {
			return BowArrowIcon;
		}
		if (name.toLowerCase().includes('english')) {
			return BookOpenTextIcon;
		}
		if (name.toLowerCase().includes('geography')) {
			return MapIcon;
		}
		return FileQuestionIcon;
	};

	let {
		subjects,
		user,
		school,
		campuses
	}: {
		subjects: { subject: Subject; subjectOffering: SubjectOffering }[];
		user: any;
		school: School | null;
		campuses: Campus[];
	} = $props();
	const sidebar = Sidebar.useSidebar();
	const fullName = convertToFullName(user.firstName, user.middleName, user.lastName);
	let form: HTMLFormElement | null = $state(null);

	// Helper function to check if a main menu item is active
	function isMainItemActive(itemUrl: string): boolean {
		return page.url.pathname === itemUrl;
	}

	// Helper function to check if a subject is active (any of its sub-pages are active)
	function isSubjectActive(subjectId: string): boolean {
		return page.url.pathname.startsWith(`/subjects/${subjectId}`);
	}

	// Helper function to check if a subject sub-item is active
	function isSubjectSubItemActive(subjectId: string, subUrl: string): boolean {
		const subjectBasePath = `/subjects/${subjectId}`;

		if (subUrl === '') {
			// For home (empty subUrl), only match the exact base path
			return page.url.pathname === subjectBasePath;
		} else {
			// For other sub-items, check if current path starts with the expected path
			const expectedPath = `${subjectBasePath}/${subUrl}`;
			return page.url.pathname === expectedPath || page.url.pathname.startsWith(expectedPath + '/');
		}
	}

	// Track the open state of each collapsible
	let collapsibleStates = $state(
		subjects.reduce(
			(acc, subject) => {
				// Don't auto-open, start with all collapsed
				acc[subject.subject.id] = false;
				return acc;
			},
			{} as Record<string, boolean>
		)
	);

	// Watch for sidebar state changes and close all collapsibles when sidebar closes
	$effect(() => {
		if (!sidebar.leftOpen) {
			// Close all collapsibles when sidebar is collapsed
			collapsibleStates = subjects.reduce(
				(acc, subject) => {
					acc[subject.subject.id] = false;
					return acc;
				},
				{} as Record<string, boolean>
			);
		}
	});
</script>

<Sidebar.Root collapsible="icon" class="h-full">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" side="left" class="hover:bg-sidebar active:bg-sidebar">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div
								class="bg-sidebar-accent dark:bg-sidebar-primary text-sidebar-accent-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
							>
								<img src={school?.logoUrl} alt="{school?.name || 'school'} logo" class="size-5" />
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-medium">{school?.name}</span>
								{#if campuses.length >= 1}
									<span class="truncate text-xs">{campuses[0].name}</span>
								{:else if campuses.length === 0}
									<span class="truncate text-xs">No campuses</span>
								{/if}
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item}
						{#if item.roles.includes('any') || item.roles.includes(user.type)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									side="left"
									isActive={isMainItemActive(item.url)}
									tooltipContent={item.title}
								>
									{#snippet child({ props })}
										<a href={item.url} {...props}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/if}
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		{#if subjects.length > 0}
			<Sidebar.Group>
				<Sidebar.GroupLabel>
					<a href="/subjects" class="text-lg font-semibold">Subjects</a>
				</Sidebar.GroupLabel>

				<Sidebar.Menu>
					{#each subjects as subject}
						<Collapsible.Root
							bind:open={collapsibleStates[subject.subject.id]}
							class="group/collapsible"
						>
							<Collapsible.Trigger>
								onclick={() => {
									if (!sidebar.leftOpen) {
										sidebar.setLeftOpen(true);
									}
								}}
								{#snippet child({ props })}
									{#if sidebar.leftOpen == false}
										<a 
											href="/subjects/{subject.subjectOffering.id}"
											onclick={() => {
												if (!sidebar.leftOpen) {
													sidebar.setLeftOpen(true);
												}
											}}
										>
											<Sidebar.MenuButton
												side="left"
												tooltipContent={subject.subject.name}
												isActive={isSubjectActive(subject.subjectOffering.id.toString())}
												{...props}
											>
												{@const IconComponent = subjectNameToIcon(subject.subject.name)}
												<IconComponent class="mr-2" />

												<span>{subject.subject.name}</span>
												<ChevronDownIcon
													class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
												/>
											</Sidebar.MenuButton>
										</a>
									{:else}
										<Sidebar.MenuButton
											side="left"
											tooltipContent={subject.subject.name}
											isActive={isSubjectActive(subject.subjectOffering.id.toString())}
											{...props}
										>
											{@const IconComponent = subjectNameToIcon(subject.subject.name)}
											<IconComponent class="mr-2" />

											<span class="whitespace-nowrap">{subject.subject.name}</span>
											<ChevronDownIcon
												class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
											/>
										</Sidebar.MenuButton>
									{/if}
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each subjectItems as item}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton
												isActive={isSubjectSubItemActive(
													subject.subjectOffering.id.toString(),
													item.url
												)}
											>
												{#snippet child({ props })}
													<a
														href={`/subjects/${subject.subjectOffering.id}/${item.url}`}
														{...props}
													>
														<item.icon />
														<span>{item.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Collapsible.Root>
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>
		{/if}
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								side="left"
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<Avatar.Root class="h-8 w-8 rounded-lg">
									<Avatar.Image src={user.avatarUrl} alt={fullName} />
									<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">{fullName}</span>
									<span class="truncate text-xs">{user.email}</span>
								</div>
								<ChevronsUpDownIcon className="ml-auto size-4" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenu.Label class="p-0 font-normal">
							<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar.Root class="h-8 w-8 rounded-lg">
									<Avatar.Image src={user.avatarUrl} alt={fullName} />
									<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">{fullName}</span>
									<span class="truncate text-xs">{user.email}</span>
								</div>
							</div>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<form method="post" action="/?/logout" bind:this={form}>
							<DropdownMenu.Item class="cursor-pointer" onclick={() => form!.submit()}>
								<LogOutIcon />
								<input type="submit" value="Logout" class="cursor-pointer" />
							</DropdownMenu.Item>
						</form>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
