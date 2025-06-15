<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import BotIcon from '@lucide/svelte/icons/bot';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import PiIcon from '@lucide/svelte/icons/pi';
	import BookOpenTextIcon from '@lucide/svelte/icons/book-open-text';
	import BeakerIcon from '@lucide/svelte/icons/beaker';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
	import BookCheckIcon from '@lucide/svelte/icons/book-check';
	import BookOpenCheckIcon from '@lucide/svelte/icons/book-open-check';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import MapIcon from '@lucide/svelte/icons/map';
	import FileQuestionIcon from '@lucide/svelte/icons/file-question';
	import type { Subject } from '$lib/server/db/schema';

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
		},
		{
			title: 'AI',
			url: '/ai',
			icon: BotIcon
		},
		{
			title: 'Settings',
			url: '/settings',
			icon: SettingsIcon
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
		},
		{
			title: 'Assignments',
			url: 'assignments',
			icon: BookCheckIcon
		},
		{
			title: 'Chat',
			url: 'chat',
			icon: MessageCircleIcon
		}
	];

	const subjectNameToIcon = (name: string) => {
		switch (name.toLowerCase()) {
			case 'maths':
				return PiIcon;
			case 'science':
				return BeakerIcon;
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

	let { subjects }: { subjects: Subject[] } = $props();
</script>

<Sidebar.Root collapsible="icon" class="h-full">
	<Sidebar.Header />
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Trigger />
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
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
		{#each subjects as subject}
			<Collapsible.Root open={false} class="group/collapsible">
				<Sidebar.Group>
					<Sidebar.GroupLabel>
						{#snippet child({ props })}
							<Collapsible.Trigger {...props}>
								{@const IconComponent = subjectNameToIcon(subject.name)}
								<IconComponent class="mr-2" />
								{subject.name}
								<ChevronDownIcon
									class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
								/>
							</Collapsible.Trigger>
						{/snippet}
					</Sidebar.GroupLabel>
					<Collapsible.Content>
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								{#each subjectItems as item}
									<Sidebar.MenuItem>
										<Sidebar.MenuButton>
											{#snippet child({ props })}
												<a href={`/subjects/${subject.id}/${item.url}`} {...props}>
													<item.icon />
													<span>{item.title}</span>
												</a>
											{/snippet}
										</Sidebar.MenuButton>
									</Sidebar.MenuItem>
								{/each}
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Collapsible.Content>
				</Sidebar.Group>
			</Collapsible.Root>
		{/each}
	</Sidebar.Content>
	<Sidebar.Footer />
</Sidebar.Root>
