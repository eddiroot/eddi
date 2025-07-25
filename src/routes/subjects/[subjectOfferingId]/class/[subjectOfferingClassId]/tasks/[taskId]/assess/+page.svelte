<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
	import { enhance } from '$app/forms';
	import { FileText, ChevronLeft, ChevronRight, Users, ZoomIn, ZoomOut } from '@lucide/svelte/icons';
	import ResourceCard from '$lib/components/ui/resource-card/resource-card.svelte';
	import Rubric from '$lib/components/rubric.svelte';
	import PdfViewer from '$lib/components/pdf-viewer.svelte';

	let { data } = $props();

	let {
		task,
		classTask,
		rubric,
		submissions,
		selectedSubmission,
		selectedResources,
		selectedStudentId,
		subjectOfferingId,
		subjectOfferingClassId,
		user
	} = $derived(data);

	let feedback = $state('');
	let isSubmitting = $state(false);
	let isSheetOpen = $state(false);

	// Update feedback when selectedSubmission changes
	$effect(() => {
		feedback = selectedSubmission?.comment || '';
	});

	// Open sheet when student is selected
	$effect(() => {
		if (selectedStudentId) {
			isSheetOpen = true;
		}
	});

	function selectStudent(studentId: string) {
		const url = new URL(page.url);
		url.searchParams.set('studentId', studentId);
		goto(url.toString());
	}

	// Clear student selection
	function clearSelection() {
		const url = new URL(page.url);
		url.searchParams.delete('studentId');
		goto(url.toString());
	}

	// Get next/previous student for navigation
	let currentIndex = $derived(selectedStudentId ? 
		submissions.findIndex(s => s.authorId === selectedStudentId) : -1);
	let hasNext = $derived(currentIndex >= 0 && currentIndex < submissions.length - 1);
	let hasPrevious = $derived(currentIndex > 0);

	function navigateToNext() {
		if (hasNext) {
			selectStudent(submissions[currentIndex + 1].authorId);
		}
	}

	function navigateToPrevious() {
		if (hasPrevious) {
			selectStudent(submissions[currentIndex - 1].authorId);
		}
	}

	// Check if file is PDF
	function isPdf(contentType: string): boolean {
		return contentType === 'application/pdf';
	}
</script>

<div class="h-full flex">
	<!-- Main PDF Viewer Area - Scrollable at right edge -->
	<div class="flex-1 bg-muted/30">
		{#if selectedSubmission && selectedResources.length > 0}
			{@const pdfResource = selectedResources.find(r => isPdf(r.contentType))}
			{@const imageResource = selectedResources.find(r => r.contentType.startsWith('image/'))}
			
			{#if pdfResource && pdfResource.downloadUrl}
				<PdfViewer url={pdfResource.downloadUrl} fileName={pdfResource.fileName} />
			{:else if imageResource && imageResource.downloadUrl}
				<div class="h-full overflow-y-auto">
					<div class="flex justify-center pt-8 pb-8">
						<div class="max-w-4xl">
							<img 
								src={imageResource.downloadUrl} 
								alt={imageResource.fileName}
								class="max-w-full object-contain shadow-lg rounded-lg"
							/>
						</div>
					</div>
				</div>
			{:else}
				<div class="h-full flex items-center justify-center">
					<div class="text-center text-muted-foreground">
						<FileText class="h-12 w-12 mx-auto mb-2" />
						<p class="text-lg font-medium mb-1">No Preview Available</p>
						<p class="text-sm">This file type cannot be previewed</p>
					</div>
				</div>
			{/if}
		{:else}
			<div class="h-full flex items-center justify-center">
				<div class="text-center text-muted-foreground">
					<Users class="h-12 w-12 mx-auto mb-2" />
					<p class="text-lg font-medium mb-1">Select a Student</p>
					<p class="text-sm">Choose a student to view their submission</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Student Assessment Side Panel - Fixed height, no overflow -->
	<div class="w-[700px] border-l bg-background h-full flex flex-col">
		<div class="h-full flex flex-col">
			<!-- Task Header -->
			<div class="p-4 border-b bg-muted/20">
				<div class="flex items-center justify-between mb-2">
					<h1 class="text-lg font-bold">{task.title}</h1>
					<Button 
						variant="outline" 
						size="sm"
						href="/subjects/{subjectOfferingId}/class/{subjectOfferingClassId}/tasks/{task.id}"
					>
						Back
					</Button>
				</div>
				<p class="text-sm text-muted-foreground">
					{submissions.length} student{submissions.length !== 1 ? 's' : ''} submitted
				</p>
			</div>
			{#if selectedSubmission}
				<!-- Student Header with Navigation -->
				<div class="p-4 border-b bg-muted/30">
					<div class="flex items-center justify-between mb-2">
						<h2 class="text-lg font-semibold">
							{selectedSubmission.student.firstName} {selectedSubmission.student.lastName}
						</h2>
						<div class="flex items-center gap-1">
							<Button 
								variant="ghost" 
								size="sm" 
								disabled={!hasPrevious}
								onclick={navigateToPrevious}
							>
								<ChevronLeft class="h-4 w-4" />
							</Button>
							<Button 
								variant="ghost" 
								size="sm" 
								disabled={!hasNext}
								onclick={navigateToNext}
							>
								<ChevronRight class="h-4 w-4" />
							</Button>
						</div>
					</div>
					<p class="text-sm text-muted-foreground">{selectedSubmission.student.email}</p>
					<Badge variant={selectedSubmission.comment ? 'default' : 'secondary'} class="text-xs mt-2">
						{selectedSubmission.comment ? 'Feedback Given' : 'Not Assessed'}
					</Badge>
				</div>

				<!-- Scrollable Content -->
				<ScrollArea class="flex-1">
					<div class="p-4 space-y-6">
						<!-- Response Section -->
						<div>
							<h3 class="text-sm font-semibold mb-3">Response</h3>
							{#if selectedResources.length > 0}
								<div class="space-y-2">
									{#each selectedResources as resource (resource.id)}
										<ResourceCard 
											resource={{
												id: resource.id,
												fileName: resource.fileName,
												fileSize: resource.fileSize,
												resourceType: resource.resourceType || 'document'
											}}
											variant="default"
											showRemoveButton={false}
											onOpen={() => {
												if (resource.downloadUrl) {
													window.open(resource.downloadUrl, '_blank');
												}
											}}
										/>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">No files submitted</p>
							{/if}
						</div>

						<!-- Rubric Section -->
						{#if rubric}
							<div>
								<h3 class="text-sm font-semibold mb-3">Rubric</h3>
								<div class="space-y-2">
									{#each rubric.rows as { row, cells } (row.id)}
										<details class="border rounded-lg">
											<summary class="p-3 cursor-pointer hover:bg-muted/50 font-medium text-sm">
												{row.title}
											</summary>
											<div class="p-3 pt-0">
												<div class="grid grid-cols-2 gap-2">
													{#each ['exemplary', 'accomplished', 'developing', 'beginning'] as level}
														{@const cell = cells.find(c => c.level === level)}
														<div class="border rounded p-2 bg-card text-xs">
															<div class="font-medium capitalize mb-1 text-center">{level}</div>
															{#if cell}
																<p class="text-muted-foreground leading-relaxed mb-2">
																	{cell.description}
																</p>
																<div class="text-xs font-medium text-center border-t pt-1">
																	{cell.marks} {cell.marks === 1 ? 'mark' : 'marks'}
																</div>
															{:else}
																<p class="text-muted-foreground italic text-center">
																	Not defined
																</p>
															{/if}
														</div>
													{/each}
												</div>
											</div>
										</details>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Assessment Form -->
						<div>
							<h3 class="text-sm font-semibold mb-3">Assessment & Feedback</h3>
							<form 
								method="POST" 
								action="?/updateFeedback"
								use:enhance={() => {
									isSubmitting = true;
									return async ({ result, update }) => {
										isSubmitting = false;
										if (result.type === 'success') {
											console.log('Feedback updated successfully');
										}
										await update();
									};
								}}
							>
								<input type="hidden" name="studentId" value={selectedSubmission.authorId} />
								
								<div class="space-y-4">
									<!-- Current Feedback Display -->
									{#if selectedSubmission.comment}
										<div>
											<p class="text-xs font-medium text-muted-foreground mb-1">Current Feedback:</p>
											<div class="p-2 bg-muted rounded text-xs">
												{selectedSubmission.comment}
											</div>
										</div>
										<Separator />
									{/if}

									<!-- Feedback Input -->
									<div>
										<label for="feedback" class="text-xs font-medium">
											{selectedSubmission.comment ? 'Update Feedback:' : 'Add Feedback:'}
										</label>
										<Textarea
											id="feedback"
											name="feedback"
											bind:value={feedback}
											placeholder="Enter your feedback for this submission..."
											class="mt-1 text-sm"
											rows={4}
										/>
									</div>

									<Button type="submit" disabled={isSubmitting} class="w-full" size="sm">
										{isSubmitting ? 'Saving...' : 'Save Feedback'}
									</Button>
								</div>
							</form>
						</div>
					</div>
				</ScrollArea>
			{:else}
				<!-- Student Selection -->
				<div class="p-4 border-b">
					<h3 class="text-sm font-semibold mb-3">Students ({submissions.length})</h3>
				</div>
				<ScrollArea class="flex-1">
					<div class="p-4 space-y-2">
						{#each submissions as submission (submission.id)}
							<button
								class="w-full text-left p-3 rounded-md border transition-colors hover:bg-muted"
								onclick={() => selectStudent(submission.authorId)}
							>
								<div class="font-medium text-sm">
									{submission.student.firstName} {submission.student.lastName}
								</div>
								<div class="text-xs text-muted-foreground mt-1">
									{submission.student.email}
								</div>
								<div class="flex items-center gap-2 mt-2">
									<Badge variant={submission.comment ? 'default' : 'secondary'} class="text-xs">
										{submission.comment ? 'Feedback Given' : 'Not Assessed'}
									</Badge>
								</div>
							</button>
						{/each}
						
						{#if submissions.length === 0}
							<div class="text-center text-muted-foreground py-8 text-sm">
								No submissions yet
							</div>
						{/if}
					</div>
				</ScrollArea>
			{/if}
		</div>
	</div>
</div>
