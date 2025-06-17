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
</script>

<Sidebar.Root collapsible="icon" class="h-full">
	<Sidebar.Header>
		<a href="/" class="flex items-center gap-x-1">
			<img src="/wombat-no-bg.png" alt="eddi logo" class="h-8 w-8" />
			{#if !sidebar.isMobile && sidebar.open}
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
							<Sidebar.MenuButton tooltipContent={item.title}>
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
			<Sidebar.GroupLabel>Subjects</Sidebar.GroupLabel>
			<Sidebar.Menu>
				{#each subjects as subject}
					<Collapsible.Root open={false} class="group/collapsible">
						<Collapsible.Trigger>
							{#snippet child({ props })}
								<Sidebar.MenuButton tooltipContent={subject.name} {...props}>
									{@const IconComponent = subjectNameToIcon(subject.name)}
									<IconComponent class="mr-2" />
									<span>{subject.name}</span>
									<ChevronDownIcon
										class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
									/>
								</Sidebar.MenuButton>
							{/snippet}
						</Collapsible.Trigger>

						<Collapsible.Content>
							<Sidebar.MenuSub>
								{#each subjectItems as item}
									<Sidebar.MenuSubItem>
										<Sidebar.MenuSubButton>
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
						<DropdownMenu.Group>
							<DropdownMenu.Item>Account</DropdownMenu.Item>
							<DropdownMenu.Item>Notifications</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<LogOutIcon />
							Log out
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
