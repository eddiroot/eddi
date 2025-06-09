<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let { data, form } = $props();
	let { subjectIdInt } = data;

	let isSubmitting = $state(false);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>New Post</Card.Title>
		<Card.Description>
			Share your thoughts, ask questions, or make announcements to your classmates.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			method="post"
			action="?/create"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
			class="space-y-6"
		>
			<div class="space-y-2">
				<label for="type" class="block text-sm font-medium">Post Type</label>
				<select
					name="type"
					id="type"
					required
					class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 py-1 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
				>
					<option value="">Select post type...</option>
					<option value="discussion">Discussion</option>
					<option value="question">Question</option>
					<option value="announcement">Announcement</option>
					<option value="qanda">Q&A</option>
				</select>
			</div>

			<div class="space-y-2">
				<label for="title" class="block text-sm font-medium">Title</label>
				<Input
					type="text"
					name="title"
					id="title"
					placeholder="Enter a descriptive title for your post"
					required
					class="w-full"
				/>
			</div>

			<div class="space-y-2">
				<label for="content" class="block text-sm font-medium">Content</label>
				<Textarea
					name="content"
					id="content"
					placeholder="Write your discussion post content here..."
					required
					class="min-h-[200px] w-full"
				/>
			</div>

			{#if form?.message}
				<div
					class="text-destructive bg-destructive/10 border-destructive/20 rounded-md border p-3 text-sm"
				>
					{form.message}
				</div>
			{/if}

			<div class="flex gap-3 pt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Creating...' : 'Create Post'}
				</Button>
				<Button variant="outline" href="/subjects/{subjectIdInt}/discussion">Cancel</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
