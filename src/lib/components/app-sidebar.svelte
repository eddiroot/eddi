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
	import { convertToFullName, userPermissions, getPermissions } from '$lib/utils';
	import HomeIcon from '@lucide/svelte/icons/home';
	import { page } from '$app/state';
	import OrbitIcon from '@lucide/svelte/icons/orbit';
	import LocationEdit from '@lucide/svelte/icons/location-edit';
	import UsersIcon from '@lucide/svelte/icons/users';
	import RouteIcon from '@lucide/svelte/icons/route';

	const items = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboardIcon,
			requiredPermission: userPermissions.viewDashboard
		},
		{
			title: 'Admin',
			url: '/admin',
			icon: WrenchIcon,
			requiredPermission: userPermissions.viewAdmin
		},
		{
			title: 'Timetable',
			url: '/timetable',
			icon: CalendarDaysIcon,
			requiredPermission: userPermissions.viewTimetable
		},
		{
			title: 'Attendance',
			url: '/attendance',
			icon: UsersIcon,
			requiredPermission: userPermissions.viewGuardianAttendance
		}
	];

	const nestedItems = [
		{
			title: 'Home',
			url: '',
			icon: HomeIcon,
			classLevel: true
		},
		{
			title: 'Attendance',
			url: 'attendance',
			icon: UsersIcon,
			classLevel: true,
			requiredPermission: userPermissions.viewClassAttendance
		},
		{
			title: 'Discussion',
			url: 'discussion',
			icon: MessagesSquareIcon,
			classLevel: false
		},
		{
			title: 'Tasks',
			url: 'tasks',
			icon: BookOpenCheckIcon,
			classLevel: true
		},
		{
			title: 'Course Map',
			url: 'curriculum',
			icon: RouteIcon,
			classLevel: false
		},
		{
			title: 'Analytics',
			url: 'analytics',
			icon: BarChart3Icon,
			classLevel: true,
			requiredPermission: userPermissions.viewAnalytics
		}
	];

	const classItems = nestedItems.filter((item) => item.classLevel);
	const subjectItems = nestedItems.filter((item) => !item.classLevel);

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
		subjects: Array<{
			subject: Subject;
			subjectOffering: SubjectOffering;
			classes: Array<{
				id: number;
				name: string;
				subOfferingId: number;
			}>;
		}>;
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

	// Helper function to check if a class is active
	function isClassActive(subjectOfferingId: string, classId: string): boolean {
		return page.url.pathname.startsWith(`/subjects/${subjectOfferingId}/class/${classId}`);
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

	// Helper function to check if a class sub-item is active
	function isClassSubItemActive(
		subjectOfferingId: string,
		classId: string,
		subUrl: string
	): boolean {
		const classBasePath = `/subjects/${subjectOfferingId}/class/${classId}`;

		if (subUrl === '') {
			// For home (empty subUrl), only match the exact base path
			return page.url.pathname === classBasePath;
		} else {
			// For other sub-items, check if current path starts with the expected path
			const expectedPath = `${classBasePath}/${subUrl}`;
			return page.url.pathname === expectedPath || page.url.pathname.startsWith(expectedPath + '/');
		}
	}

	// Track the open state of each collapsible (subjects and classes when multiple)
	let collapsibleStates = $state(
		subjects.reduce(
			(acc, subject) => {
				// Don't auto-open, start with all collapsed
				acc[`subject-${subject.subject.id}`] = false;
				// Add states for each class if there are multiple classes
				if (subject.classes.length > 1) {
					subject.classes.forEach((cls) => {
						acc[`class-${cls.id}`] = false;
					});
				}
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
					acc[`subject-${subject.subject.id}`] = false;
					// Add states for each class if there are multiple classes
					if (subject.classes.length > 1) {
						subject.classes.forEach((cls) => {
							acc[`class-${cls.id}`] = false;
						});
					}
					return acc;
				},
				{} as Record<string, boolean>
			);
		}
	});

	let current_campus = $state(campuses.length > 0 ? campuses[0] : null);

	const permissions = $state(getPermissions(user?.type || ''));
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
							{#if campuses.length >= 1}
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">{school?.name}</span>
									{#if campuses.length >= 1 && current_campus}
										<span class="truncate text-xs">{current_campus.name}</span>
									{:else if campuses.length === 0}
										<span class="truncate text-xs">No campuses</span>
									{/if}
								</div>
								{#if campuses.length > 1}
									{#if sidebar.leftOpen}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger>
												<LocationEdit class="ml-auto size-4 transition-transform" />
											</DropdownMenu.Trigger>
											<DropdownMenu.Content class="w-(--bits-dropdown-menu-anchor-width)">
												{#each campuses as campus}
													<DropdownMenu.Item
														class="cursor-pointer"
														onclick={() => {
															current_campus = campus;
														}}
													>
														<span>{campus.name}</span>
													</DropdownMenu.Item>
												{/each}
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									{:else}
										<LocationEdit class="ml-auto size-4 transition-transform" />
									{/if}
								{/if}
							{:else}
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-medium">{school?.name}</span>
								</div>
							{/if}
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
						{#if permissions.includes(item.requiredPermission)}
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
		{#if subjects.some((subject) => subject.classes.length > 1) && subjectItems.length > 0}
			<Sidebar.Group>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each subjectItems as item}
							{#if !item.requiredPermission || permissions.includes(item.requiredPermission)}
								{#each subjects.filter((subject) => subject.classes.length > 1) as subject}
									<Sidebar.MenuItem>
										<Sidebar.MenuButton
											side="left"
											isActive={isSubjectSubItemActive(
												subject.subjectOffering.id.toString(),
												item.url
											)}
											tooltipContent={`${subject.subject.name} - ${item.title}`}
										>
											{#snippet child({ props })}
												<a href={`/subjects/${subject.subjectOffering.id}/${item.url}`} {...props}>
													<item.icon />
													<span>{subject.subject.name} - {item.title}</span>
												</a>
											{/snippet}
										</Sidebar.MenuButton>
									</Sidebar.MenuItem>
								{/each}
							{/if}
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}
		{#if subjects.length > 0}
			<Sidebar.Group>
				<Sidebar.GroupLabel>
					<a href="/subjects" class="text-lg font-semibold">Subjects</a>
				</Sidebar.GroupLabel>

				<Sidebar.Menu>
					{#each subjects as subject}
						<Collapsible.Root
							bind:open={collapsibleStates[`subject-${subject.subject.id}`]}
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
									{#if subject.classes.length === 1}
										<!-- Single class: show ALL nested items under the subject dropdown -->
										{@const singleClass = subject.classes[0]}
										{#each nestedItems as item}
											{#if !item.requiredPermission || permissions.includes(item.requiredPermission)}
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton
														isActive={item.classLevel
															? isClassSubItemActive(
																	subject.subjectOffering.id.toString(),
																	singleClass.id.toString(),
																	item.url
																)
															: isSubjectSubItemActive(
																	subject.subjectOffering.id.toString(),
																	item.url
																)}
													>
														{#snippet child({ props })}
															<a
																href={item.classLevel
																	? `/subjects/${subject.subjectOffering.id}/class/${singleClass.id}/${item.url}`
																	: `/subjects/${subject.subjectOffering.id}/${item.url}`}
																{...props}
															>
																<item.icon />
																<span>{item.title}</span>
															</a>
														{/snippet}
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											{/if}
										{/each}
									{:else}
										<!-- Multiple classes: show collapsible classes with only class-level items -->
										{#each subject.classes as classItem}
											<Collapsible.Root
												bind:open={collapsibleStates[`class-${classItem.id}`]}
												class="group/collapsible-class"
											>
												<Collapsible.Trigger>
													{#snippet child({ props })}
														<Sidebar.MenuSubButton
															isActive={isClassActive(
																subject.subjectOffering.id.toString(),
																classItem.id.toString()
															)}
															{...props}
														>
															<HomeIcon />
															<span>{classItem.name}</span>
															<ChevronDownIcon
																class="ml-auto transition-transform group-data-[state=open]/collapsible-class:rotate-180"
															/>
														</Sidebar.MenuSubButton>
													{/snippet}
												</Collapsible.Trigger>
												<Collapsible.Content>
													<Sidebar.MenuSub>
														{#each classItems as item}
															{#if !item.requiredPermission || permissions.includes(item.requiredPermission)}
																<Sidebar.MenuSubItem>
																	<Sidebar.MenuSubButton
																		isActive={isClassSubItemActive(
																			subject.subjectOffering.id.toString(),
																			classItem.id.toString(),
																			item.url
																		)}
																	>
																		{#snippet child({ props })}
																			<a
																				href={`/subjects/${subject.subjectOffering.id}/class/${classItem.id}/${item.url}`}
																				{...props}
																			>
																				<item.icon />
																				<span>{item.title}</span>
																			</a>
																		{/snippet}
																	</Sidebar.MenuSubButton>
																</Sidebar.MenuSubItem>
															{/if}
														{/each}
													</Sidebar.MenuSub>
												</Collapsible.Content>
											</Collapsible.Root>
										{/each}
									{/if}
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
