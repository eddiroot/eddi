<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import * as Card from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Separator } from '$lib/components/ui/separator';
	import { convertToFullName } from '$lib/utils';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import type { PaneAPI } from 'paneforge';
	import { page } from '$app/state';

	let { children, data } = $props();

	let announcementsPane: PaneAPI | null = $state(null);
	let isAnnouncementsCollapsed = $state(false);

	const currentThreadId = $derived(() => page.url.pathname.split('/').pop() || '');
</script>

<div class="grid h-full grid-cols-[300px_1fr] overflow-y-hidden">
	<div class="h-full border-r border-b">
		<div class="p-2">
			<Button
				href="/subjects/{data.subjectOfferingIdInt}/discussion/new"
				variant="outline"
				class="w-full">New Post <PlusIcon /></Button
			>
		</div>
		<Separator />
		{#if data?.threads}
			<Resizable.PaneGroup direction="vertical">
				<div
					class="bg-primary text-primary-foreground flex items-center justify-between border-b px-6"
				>
					<h3 class="text-sm font-medium">Announcements</h3>
					<Button
						onclick={() => {
							if (announcementsPane) {
								if (isAnnouncementsCollapsed) {
									announcementsPane.expand();
								} else {
									announcementsPane.collapse();
								}
							}
						}}
						variant="ghost"
						size="icon"
					>
						<ChevronsUpDown />
					</Button>
				</div>
				<Resizable.Pane
					defaultSize={data.threads.length > 0 ? 30 : 0}
					collapsible
					collapsedSize={0}
					bind:this={announcementsPane}
					onCollapse={() => (isAnnouncementsCollapsed = true)}
					onExpand={() => (isAnnouncementsCollapsed = false)}
				>
					<ScrollArea type="always" class="h-full">
						<div>
							{#each data.threads.filter((thread) => thread.thread.type == 'announcement') as thread}
								<a
									href="/subjects/{data.subjectOfferingIdInt}/discussion/{thread.thread.id}"
									class="block"
								>
									<Card.Root
										class="bg-background rounded-none border-none shadow-none {currentThreadId() ==
										thread.thread.id.toString()
											? 'bg-accent'
											: ''}"
									>
										<Card.Header>
											<Card.Title>
												{thread.thread.title}
											</Card.Title>
											<Card.Description>
												by {convertToFullName(
													thread.user.firstName,
													thread.user.middleName,
													thread.user.lastName
												)}
											</Card.Description>
										</Card.Header>
										<Card.Footer>
											<div class="text-muted-foreground flex items-center text-xs">
												<span>Created {new Date(thread.thread.createdAt).toLocaleDateString()}</span
												>
											</div>
										</Card.Footer>
									</Card.Root>
									<Separator />
								</a>
							{/each}
						</div>
					</ScrollArea>
				</Resizable.Pane>
				<Resizable.Handle withHandle />
				<div class="bg-primary text-primary-foreground border-b px-6 py-2">
					<h3 class="text-sm font-medium">Other</h3>
				</div>
				<Resizable.Pane defaultSize={70}>
					<ScrollArea type="always" class="h-full">
						<div>
							{#each data.threads.filter((thread) => thread.thread.type != 'announcement') as thread}
								<a
									href="/subjects/{data.subjectOfferingIdInt}/discussion/{thread.thread.id}"
									class="block"
								>
									<Card.Root
										class="bg-background rounded-none border-none shadow-none {currentThreadId() ==
										thread.thread.id.toString()
											? 'bg-accent'
											: ''}"
									>
										<Card.Header>
											<Card.Title>
												{thread.thread.title}
											</Card.Title>
											<Card.Description>
												by {convertToFullName(
													thread.user.firstName,
													thread.user.middleName,
													thread.user.lastName
												)}
											</Card.Description>
										</Card.Header>
										<Card.Footer>
											<div class="text-muted-foreground flex items-center text-xs">
												<span>Created {new Date(thread.thread.createdAt).toLocaleDateString()}</span
												>
											</div>
										</Card.Footer>
									</Card.Root>
									<Separator />
								</a>
							{/each}
						</div>
					</ScrollArea>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		{:else}
			<p>No discussions available.</p>
		{/if}
	</div>
	<div class="overflow-y-scroll p-8">
		{@render children()}
	</div>
</div>
