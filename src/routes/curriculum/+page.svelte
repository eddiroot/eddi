<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { BookOpen, Calendar, ArrowRight } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	// Create subject slug for URL
	function createSubjectSlug(subjectName: string): string {
		return subjectName.toLowerCase().replace(/\s+/g, '-');
	}
</script>

<div class="container mx-auto py-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Curriculum Maps</h1>
			<p class="text-muted-foreground mt-1">
				Select a subject to view and edit its curriculum mapping
			</p>
		</div>
	</div>

	<!-- Subjects Grid -->
	{#if data.subjects.length === 0}
		<Card>
			<CardContent class="text-center py-12">
				<BookOpen class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
				<h3 class="text-lg font-semibold mb-2">No Subjects Available</h3>
				<p class="text-muted-foreground mb-4">
					No subjects have been set up for your school yet. Please contact your administrator to add subjects.
				</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.subjects as subject}
				<Card class="hover:shadow-md transition-shadow cursor-pointer">
					<a href="/curriculum/{createSubjectSlug(subject.name)}" class="block">
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<BookOpen class="h-5 w-5" />
								{subject.name}
							</CardTitle>
							{#if subject.description}
								<p class="text-sm text-muted-foreground">{subject.description}</p>
							{/if}
						</CardHeader>
						<CardContent>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<Calendar class="h-4 w-4" />
									<span>View curriculum map</span>
								</div>
								<ArrowRight class="h-4 w-4 text-muted-foreground" />
							</div>
						</CardContent>
					</a>
				</Card>
			{/each}
		</div>
	{/if}
</div>
