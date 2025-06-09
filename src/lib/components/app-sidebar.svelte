<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import HouseIcon from '@lucide/svelte/icons/house';
	import BotIcon from '@lucide/svelte/icons/bot';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import PiIcon from '@lucide/svelte/icons/pi';
	import BookOpenTextIcon from '@lucide/svelte/icons/book-open-text';
	import BeakerIcon from '@lucide/svelte/icons/beaker';
	import ClockIcon from '@lucide/svelte/icons/clock';

	const items = [
		{
			title: 'Home',
			url: '/home',
			icon: HouseIcon
		},
		{
			title: 'Calendar',
			url: '/calendar',
			icon: CalendarIcon
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
			url: 'discussion'
		},
		{
			title: 'Lessons',
			url: 'lessons'
		},
		{
			title: 'Assignments',
			url: 'assignments'
		},
		{
			title: 'Chat',
			url: 'chat'
		}
	];

	const mockSubjects = [
		{
			id: 1,
			title: 'Math',
			icon: PiIcon
		},
		{
			id: 2,
			title: 'Science',
			icon: BeakerIcon
		},
		{
			id: 3,
			title: 'History',
			icon: ClockIcon
		},
		{
			id: 4,
			title: 'English',
			icon: BookOpenTextIcon
		}
	];
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
		{#each mockSubjects as subject}
			<Collapsible.Root open={false} class="group/collapsible">
				<Sidebar.Group>
					<Sidebar.GroupLabel>
						{#snippet child({ props })}
							<Collapsible.Trigger {...props}>
								<subject.icon class="mr-2" />
								{subject.title}
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
													<span class="ml-3 text-sm">{item.title}</span>
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
