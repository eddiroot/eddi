<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { enhance } from '$app/forms';
	import {
		FileText,
		ChevronLeft,
		ChevronRight,
		Users,
		ZoomIn,
		ZoomOut,
		FileIcon,
		Blocks
	} from '@lucide/svelte/icons';
	import ResourceCard from '$lib/components/ui/resource-card/resource-card.svelte';
	import PdfViewer from './components/PdfViewer.svelte';
	import CriteriaCard from './components/CriteriaCard.svelte';
	import AnswerCard from './components/AnswerCard.svelte';

	let { data } = $props();

	let {
		task,
		classTask,
		submissions,
		selectedSubmission,
		selectedResources,
		selectedStudentBlockResponses,
		selectedStudentId,
		subjectOfferingId,
		subjectOfferingClassId,
		user
	} = $derived(data);

	// State management
	let selectedStudentIndex = $state(0);
	let selectedBlockId = $state<number | null>(null);
	let showResources = $state(false); // Toggle between resources and task blocks
	let feedback = $state('');
	let isSubmitting = $state(false);

	// Derived values
	const currentSubmission = $derived(selectedSubmission);
	const currentStudent = $derived(selectedSubmission?.student);
	const currentBlockResponses = $derived(selectedStudentBlockResponses);
	const selectedBlock = $derived(
		selectedBlockId
			? currentBlockResponses?.find((br) => br.taskBlock.id === selectedBlockId)
			: null
	);

	// Initialize feedback and selected block
	$effect(() => {
		feedback = selectedSubmission?.comment || '';
		if (currentBlockResponses && currentBlockResponses.length > 0 && !selectedBlockId) {
			selectedBlockId = currentBlockResponses[0].taskBlock.id;
		}
	});

	// Handle student navigation
	function navigateToStudent(studentId: string) {
		const url = new URL(window.location.href);
		url.searchParams.set('studentId', studentId);
		goto(url.toString());
	}

	function nextStudent() {
		const currentIndex = submissions.findIndex((s) => s.authorId === selectedStudentId);
		if (currentIndex >= 0 && currentIndex < submissions.length - 1) {
			navigateToStudent(submissions[currentIndex + 1].authorId);
		}
	}

	function previousStudent() {
		const currentIndex = submissions.findIndex((s) => s.authorId === selectedStudentId);
		if (currentIndex > 0) {
			navigateToStudent(submissions[currentIndex - 1].authorId);
		}
	}

	// Handle block selection
	function selectBlock(blockId: number) {
		selectedBlockId = blockId;
	}
</script>

<div class="flex h-full flex-col">
	<!-- Top Navigation Bar -->
	<div class="bg-background border-b p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Button
					variant="outline"
					size="sm"
					href="/subjects/{subjectOfferingId}/class/{subjectOfferingClassId}/tasks/{task.id}"
				>
					<ChevronLeft class="mr-1 h-4 w-4" />
					Back to Task
				</Button>
				<div>
					<h1 class="text-lg font-bold">{task.title}</h1>
					<p class="text-muted-foreground text-sm">
						{submissions.length} student{submissions.length !== 1 ? 's' : ''} submitted
					</p>
				</div>
			</div>

			{#if selectedSubmission}
				<div class="flex items-center gap-4">
					<div class="text-right">
						<p class="font-medium">
							{selectedSubmission.student.firstName}
							{selectedSubmission.student.lastName}
						</p>
						<p class="text-muted-foreground text-sm">{selectedSubmission.student.email}</p>
					</div>
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={previousStudent}
							disabled={submissions.findIndex((s) => s.authorId === selectedStudentId) <= 0}
						>
							<ChevronLeft class="h-4 w-4" />
						</Button>
						<span class="px-2 text-sm">
							{submissions.findIndex((s) => s.authorId === selectedStudentId) + 1} of {submissions.length}
						</span>
						<Button
							variant="outline"
							size="sm"
							onclick={nextStudent}
							disabled={submissions.findIndex((s) => s.authorId === selectedStudentId) >=
								submissions.length - 1}
						>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if selectedSubmission}
		<!-- Main Content Area with Two Columns -->
		<div class="flex flex-1 overflow-hidden">
			<!-- Left Column - PDF Viewer or Task Blocks -->
			<div class="bg-muted/30 flex flex-1 flex-col border-r" style="width: calc(50% + 50px);">
				<!-- Left Column Header -->
				<div class="bg-background border-b p-4">
					<h2 class="text-lg font-semibold">
						{showResources ? 'PDF Viewer' : 'Student Responses'}
					</h2>
				</div>

				<!-- Left Column Content -->
				<div class="flex-1 overflow-y-auto">
					{#if showResources}
						<!-- PDF Viewer for selected resource -->
						<div class="h-full">
							{#if selectedResources.length > 0}
								<!-- For now, show the first PDF resource -->
								{@const pdfResource = selectedResources.find((r) =>
									r.fileName?.toLowerCase().endsWith('.pdf')
								)}
								{#if pdfResource && pdfResource.downloadUrl}
									<PdfViewer url={pdfResource.downloadUrl} />
								{:else}
									<div
										class="text-muted-foreground flex h-full items-center justify-center text-center"
									>
										<div>
											<FileText class="mx-auto mb-4 h-16 w-16" />
											<p class="mb-2 text-lg font-medium">No PDF Resources</p>
											<p class="text-sm">
												Select a PDF resource from the right panel to view it here
											</p>
										</div>
									</div>
								{/if}
							{:else}
								<div
									class="text-muted-foreground flex h-full items-center justify-center text-center"
								>
									<div>
										<FileText class="mx-auto mb-4 h-16 w-16" />
										<p class="mb-2 text-lg font-medium">No Resources</p>
										<p class="text-sm">This student hasn't submitted any files</p>
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<!-- Task Blocks with Student Responses (Read-only) -->
						<div class="space-y-4 p-4">
							{#if currentBlockResponses && currentBlockResponses.length > 0}
								{#if selectedStudentId}
									<!-- <ResponseViewer 
										taskBlockResponses={currentBlockResponses}
										selectedTaskBlockId={selectedBlockId ?? undefined}
										taskId={parseInt(task.id.toString())}
										classTaskId={parseInt(classTask.id.toString())}
										subjectOfferingId={parseInt(subjectOfferingId.toString())}
										subjectOfferingClassId={parseInt(subjectOfferingClassId.toString())}
										studentId={selectedStudentId}
										readonly={true}
										onTaskBlockSelect={selectBlock}
									/> -->
								{/if}
							{:else}
								<div class="text-muted-foreground py-8 text-center">
									<Blocks class="mx-auto mb-2 h-12 w-12" />
									<p class="mb-1 text-lg font-medium">No Responses</p>
									<p class="text-sm">No task block responses found for this student</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Right Column - Assessment & Controls -->
			<div class="bg-background flex w-[1000px] flex-col">
				<!-- Right Column Header -->
				<div class="border-b p-4">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold">
							{showResources ? 'Resources' : 'Assessment'}
						</h2>
						<div class="flex items-center gap-2">
							<Button
								variant={!showResources ? 'default' : 'outline'}
								size="sm"
								onclick={() => (showResources = false)}
							>
								<Blocks class="mr-1 h-4 w-4" />
								Task Blocks
							</Button>
							<Button
								variant={showResources ? 'default' : 'outline'}
								size="sm"
								onclick={() => (showResources = true)}
							>
								<FileText class="mr-1 h-4 w-4" />
								Resources
							</Button>
						</div>
					</div>
					{#if !showResources && selectedBlock}
						<p class="text-muted-foreground mt-2 text-sm">
							Assessing: {selectedBlock.taskBlock.type} block
						</p>
					{:else if !showResources}
						<p class="text-muted-foreground mt-2 text-sm">
							Select a task block to begin assessment
						</p>
					{/if}
				</div>

				<!-- Right Column Content -->
				<div class="flex-1 overflow-y-auto">
					{#if showResources}
						<!-- Resources List -->
						<div class="space-y-4 p-4">
							{#if selectedResources.length > 0}
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
							{:else}
								<div class="text-muted-foreground py-8 text-center">
									<FileText class="mx-auto mb-2 h-12 w-12" />
									<p class="mb-1 text-lg font-medium">No Resources</p>
									<p class="text-sm">This student hasn't submitted any files</p>
								</div>
							{/if}
						</div>
					{:else}
						<!-- Assessment Interface -->
						{#if selectedBlock}
							<div class="space-y-6 p-4">
								<!-- CriteriaCard and AnswerCard components without surrounding cards -->
								<div class="space-y-6">
									<CriteriaCard
										criteria={{
											id: selectedBlock.taskBlock.id,
											description: `Assessment criteria for ${selectedBlock.taskBlock.type} block`,
											marks: 10
										}}
										feedback={null}
										onFeedbackChange={(feedback) => {
											console.log('Criteria feedback changed:', feedback);
										}}
										isReadOnly={false}
									/>

									<AnswerCard
										answer={{
											id: selectedBlock.taskBlock.id,
											answer: selectedBlock.response?.response || 'No response provided',
											marks: selectedBlock.response?.marks || 0
										}}
										feedback={null}
										onFeedbackChange={(feedback) => {
											console.log('Answer feedback changed:', feedback);
										}}
										isReadOnly={false}
										maxMarks={10}
									/>
								</div>

								<Separator />

								<!-- Overall Feedback -->
								<div>
									<h3 class="mb-3 text-sm font-semibold">Overall Feedback</h3>
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
											<div>
												<label for="feedback" class="text-xs font-medium">
													General feedback for this submission:
												</label>
												<Textarea
													id="feedback"
													name="feedback"
													bind:value={feedback}
													placeholder="Enter your overall feedback for this submission..."
													class="mt-1 text-sm"
													rows={4}
												/>
											</div>

											<Button type="submit" disabled={isSubmitting} class="w-full" size="sm">
												{isSubmitting ? 'Saving...' : 'Save Overall Feedback'}
											</Button>
										</div>
									</form>
								</div>
							</div>
						{:else}
							<div class="flex h-full items-center justify-center">
								<div class="text-muted-foreground text-center">
									<Blocks class="mx-auto mb-2 h-12 w-12" />
									<p class="mb-1 text-lg font-medium">Select a Task Block</p>
									<p class="text-sm">Choose a task block above to begin assessment</p>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- Student Selection View -->
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-md">
				<div class="mb-6 text-center">
					<Users class="text-muted-foreground mx-auto mb-4 h-16 w-16" />
					<h2 class="mb-2 text-2xl font-bold">Select a Student</h2>
					<p class="text-muted-foreground">Choose a student to assess their submission</p>
				</div>

				<div class="space-y-2">
					{#each submissions as submission (submission.id)}
						<button
							class="hover:bg-muted w-full rounded-lg border p-4 text-left transition-colors"
							onclick={() => navigateToStudent(submission.authorId)}
						>
							<div class="font-medium">
								{submission.student.firstName}
								{submission.student.lastName}
							</div>
							<div class="text-muted-foreground mt-1 text-sm">
								{submission.student.email}
							</div>
							<div class="mt-2 flex items-center gap-2">
								<Badge variant={submission.comment ? 'default' : 'secondary'} class="text-xs">
									{submission.comment ? 'Feedback Given' : 'Not Assessed'}
								</Badge>
							</div>
						</button>
					{/each}

					{#if submissions.length === 0}
						<div class="text-muted-foreground py-8 text-center">
							<p>No submissions yet</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
