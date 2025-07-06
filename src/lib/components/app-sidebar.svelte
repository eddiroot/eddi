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
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
	import BookOpenCheckIcon from '@lucide/svelte/icons/book-open-check';
	import MapIcon from '@lucide/svelte/icons/map';
	import FileQuestionIcon from '@lucide/svelte/icons/file-question';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import type { Subject } from '$lib/server/db/schema';
	import { convertToFullName } from '$lib/utils';
	import HomeIcon from '@lucide/svelte/icons/home';
	import { page } from '$app/state';

	const items = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboardIcon
		},
		{
			title: 'Timetable',
			url: '/timetable',
			icon: CalendarDaysIcon
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
		}
	];

	const subjectNameToIcon = (name: string) => {
		switch (name.toLowerCase()) {
			case 'maths':
				return PiIcon;
			case 'science':
				return FlaskConicalIcon;
			case 'history':
				return ClockIcon;
			case 'english':
				return BookOpenTextIcon;
			case 'geography':
				return MapIcon;
			default:
				return FileQuestionIcon;
		}
	};

	let { subjects, user }: { subjects: Subject[]; user: any } = $props();
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
				acc[subject.id] = false;
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
					acc[subject.id] = false;
					return acc;
				},
				{} as Record<string, boolean>
			);
		}
	});
</script>

<Sidebar.Root collapsible="icon" class="h-full">
	<Sidebar.Header>
		<a href="/" class="flex items-center gap-x-1">
			<img src="/wombat-no-bg.png" alt="eddi logo" class="h-8 w-8" />
			{#if !sidebar.isMobile && sidebar.leftOpen}
				<h1 class="text-center text-lg font-semibold">eddi</h1>
			{/if}
		</a>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item}
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
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<Sidebar.Group>
			<Sidebar.GroupLabel>
				<a href="/subjects" class="text-lg font-semibold"> Subjects </a>
			</Sidebar.GroupLabel>

			<Sidebar.Menu>
				{#each subjects as subject}
					<Collapsible.Root bind:open={collapsibleStates[subject.id]} class="group/collapsible">
						<Collapsible.Trigger
							onclick={() => {
								if (!sidebar.leftOpen) {
									sidebar.setLeftOpen(true);
								}
							}}
						>
							{#snippet child({ props })}
								{#if sidebar.leftOpen == false}
									<a href="/subjects/{subject.id}">
										<Sidebar.MenuButton
											side="left"
											tooltipContent={subject.name}
											isActive={isSubjectActive(subject.id.toString())}
											{...props}
										>
											{@const IconComponent = subjectNameToIcon(subject.name)}
											<IconComponent class="mr-2" />

											<span>{subject.name}</span>
											<ChevronDownIcon
												class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
											/>
										</Sidebar.MenuButton>
									</a>
								{:else}
									<Sidebar.MenuButton
										side="left"
										tooltipContent={subject.name}
										isActive={isSubjectActive(subject.id.toString())}
										{...props}
									>
										{@const IconComponent = subjectNameToIcon(subject.name)}
										<IconComponent class="mr-2" />

										<span>{subject.name}</span>
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
											isActive={isSubjectSubItemActive(subject.id.toString(), item.url)}
										>
											{#snippet child({ props })}
												<a href={`/subjects/${subject.id}/${item.url}`} {...props}>
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
