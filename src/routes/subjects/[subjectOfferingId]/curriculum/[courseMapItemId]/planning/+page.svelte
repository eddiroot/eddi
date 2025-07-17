<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '$lib/components/ui/sheet';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
		import Calendar from '@lucide/svelte/icons/calendar';
		import Clock from '@lucide/svelte/icons/clock';
		import BookTest from '@lucide/svelte/icons/book';
		import Archive from '@lucide/svelte/icons/archive';
		import Plus from '@lucide/svelte/icons/plus';
		import Sparkles from '@lucide/svelte/icons/sparkles';
		import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';
	import LessonPlanCard from './components/LessonPlanCard.svelte';
	import VcaaLearningAreaCard from '$lib/components/CurriculumLearningAreaCard.svelte';
	import Edit from '@lucide/svelte/icons/edit';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	
	let { data, form } = $props();
	let lessonPlanDescription = $state('');
	let assessmentPlanTitle = $state('');
	let assessmentPlanDescription = $state('');
	let isGeneratingLesson = $state(false);
	let isGeneratingAssessment = $state(false);
	let generatedLessonPlan = $state<any>(null);
	let generatedAssessmentPlan = $state<string | null>(null);
	let lessonPlanDrawerOpen = $state(false);
	let isCreatingLessonPlan = $state(false);
	let currentInstruction = $state('');
	
	// Edit mode state
	let editMode = $state(false);
	let editedTopic = $state(data.courseMapItem.topic);
	let editedDescription = $state(data.courseMapItem.description || '');
	let editedStartWeek = $state(data.courseMapItem.startWeek);
	let editedDuration = $state(data.courseMapItem.duration);

	// Update edited values when data changes
	$effect(() => {
		editedTopic = data.courseMapItem.topic;
		editedDescription = data.courseMapItem.description || '';
		editedStartWeek = data.courseMapItem.startWeek;
		editedDuration = data.courseMapItem.duration;
	});

	// Handle form response
	$effect(() => {
		if (form?.success && form?.lessonPlan) {
			lessonPlanDrawerOpen = false;
			lessonPlanDescription = '';
			generatedLessonPlan = null;
			currentInstruction = '';
			invalidateAll();
		} else if (form?.success && form?.planData) {
			generatedLessonPlan = form.planData;
			currentInstruction = (form.instruction as string) || lessonPlanDescription;
		}
	});
	
	async function generateAssessmentPlan() {
		isGeneratingAssessment = true;
		// TODO: Implement AI generation
		setTimeout(() => {
			generatedAssessmentPlan = `Generated assessment plan for "${assessmentPlanTitle}": ${assessmentPlanDescription}`;
			isGeneratingAssessment = false;
		}, 2000);
	}
</script>

<!-- Hero Section with Course Map Item Image -->
<div class="relative h-64 w-full overflow-hidden mb-8">
	{#if data.courseMapItem.imageBase64}
		<img 
			src={`data:image/png;base64,${data.courseMapItem.imageBase64}`}
			alt={data.courseMapItem.topic}
			class="absolute inset-0 w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/40"></div>
	{:else}
		<div class="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"></div>
	{/if}
	
	<!-- Course Map Item Details Overlay (centered) -->
	<div class="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
		{#if editMode}
			<Input 
				bind:value={editedTopic} 
				class="text-4xl font-bold mb-2 bg-white/10 border-white/20 text-white text-center placeholder:text-white/70"
				placeholder="Course topic"
			/>
		{:else}
			<h1 class="text-4xl font-bold mb-2">{data.courseMapItem.topic}</h1>
		{/if}
		<div class="flex flex-wrap items-center justify-center gap-6 text-sm">
			<div class="flex items-center gap-1">
				<Calendar class="w-4 h-4" />
				{#if editMode}
					<span>Week</span>
					<Input 
						bind:value={editedStartWeek} 
						type="number"
						class="w-16 h-6 text-xs bg-white/10 border-white/20 text-white text-center"
					/>
				{:else}
					Week {data.courseMapItem.startWeek}
				{/if}
			</div>
			<div class="flex items-center gap-1">
				<Clock class="w-4 h-4" />
				{#if editMode}
					<Input 
						bind:value={editedDuration} 
						type="number"
						class="w-16 h-6 text-xs bg-white/10 border-white/20 text-white text-center"
					/>
					<span>weeks</span>
				{:else}
					{data.courseMapItem.duration} weeks
				{/if}
			</div>
			<div class="flex items-center gap-1">
				<BookTest class="w-4 h-4" />
				Subject
			</div>
			<div class="flex items-center gap-1">
				<Archive class="w-4 h-4" />
				8 Resources
			</div>
		</div>
	</div>
	
	<!-- Edit Button -->
	<div class="absolute top-4 right-4">
		{#if editMode}
			<div class="flex gap-2">
				<Button 
					size="sm" 
					variant="secondary"
					onclick={() => {
						// Save changes logic will go here
						editMode = false;
					}}
					class="bg-green-600 hover:bg-green-700 text-white font-medium px-4"
				>
					Save & View Mode
				</Button>
				<Button 
					size="sm" 
					variant="secondary"
					onclick={() => {
						// Reset changes
						editedTopic = data.courseMapItem.topic;
						editedDescription = data.courseMapItem.description || '';
						editedStartWeek = data.courseMapItem.startWeek;
						editedDuration = data.courseMapItem.duration;
						editMode = false;
					}}
					class="bg-red-600 hover:bg-red-700 text-white font-medium px-4"
				>
					Cancel & View Mode
				</Button>
			</div>
		{:else}
			<Button 
				size="default" 
				variant="secondary"
				onclick={() => editMode = true}
				class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 shadow-lg"
			>
				<Edit class="w-4 h-4 mr-2" />
				Edit Mode
			</Button>
		{/if}
	</div>
</div>

<div class="max-w-6xl mx-auto px-6 space-y-12">
	<!-- Description Section -->
	{#if data.courseMapItem.description || editMode}
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Description</h2>
			{#if editMode}
				<Textarea 
					bind:value={editedDescription}
					placeholder="Enter course description..."
					class="min-h-[100px] resize-y"
				/>
			{:else}
				<p class="text-muted-foreground leading-relaxed">{data.courseMapItem.description}</p>
			{/if}
		</div>
	{/if}

	<!-- Curriculum Learning Areas -->
	{#if data.learningAreas.length > 0 || data.availableLearningAreas.length > 0}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-semibold">Curriculum Learning Areas</h2>
				{#if data.availableLearningAreas.length > 0}
					{@const unassignedLearningAreas = data.availableLearningAreas.filter(
						(available) => !data.learningAreas.some((assigned) => assigned.id === available.id)
					)}
					{#if unassignedLearningAreas.length > 0}
						<Sheet>
							<SheetTrigger>
								<Button variant="outline" size="sm" class="gap-2">
									<Plus class="w-4 h-4" />
									Learning Area
								</Button>
							</SheetTrigger>
							<SheetContent class="w-[400px] max-w-[90vw] p-6">
								<SheetHeader class="space-y-2 mb-6">
									<SheetTitle>Add Learning Area</SheetTitle>
									<p class="text-sm text-muted-foreground">
										Select a learning area to associate with this course map item.
									</p>
								</SheetHeader>
								
								<div class="space-y-4">
									{#each unassignedLearningAreas as learningArea}
										<form method="POST" action="?/addLearningArea" use:enhance={() => {
											return async ({ result, update }) => {
												if (result.type === 'success') {
													invalidateAll();
												}
												await update();
											};
										}}>
											<input type="hidden" name="learningAreaId" value={learningArea.id} />
											<div class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
												<div class="flex-1">
													<h4 class="font-medium text-sm">{learningArea.name}</h4>
												</div>
												<Button type="submit" size="sm" variant="outline">
													Add
												</Button>
											</div>
										</form>
									{/each}
								</div>
							</SheetContent>
						</Sheet>
					{/if}
				{/if}
			</div>
			
			{#if data.learningAreas.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{#each data.learningAreas as la}
						<VcaaLearningAreaCard 
							learningAreaName={la.name} 
							editMode={editMode}
							onRemove={editMode ? () => {
								// Remove learning area logic will go here
								console.log('Remove learning area:', la.id);
							} : undefined}
						/>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8">
					<p class="text-muted-foreground">No learning areas assigned yet.</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Lesson Plans Section -->
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-semibold">Lesson Plans</h2>
			<Sheet bind:open={lessonPlanDrawerOpen}>
				<SheetTrigger >
					<Button variant="outline" class="gap-2">
						<Plus class="w-4 h-4" />
						Lesson Plan
					</Button>
				</SheetTrigger>
				<SheetContent class="w-[600px] max-w-[90vw] p-6 space-y-4">
					<SheetHeader class="space-y-2">
						<div class="flex items-center gap-2">
							<div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
								<Sparkles class="w-4 h-4 text-primary" />
							</div>
							<SheetTitle>Create Lesson Plan</SheetTitle>
						</div>
						<p class="text-sm text-muted-foreground">
							Describe what you want this lesson plan to cover and AI will generate a structured plan for you.
						</p>
					</SheetHeader>

					{#if generatedLessonPlan}
						<div class="space-y-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
							<div class="flex items-center gap-2 mb-2">
								<div class="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
									<Sparkles class="w-3 h-3 text-primary" />
								</div>
								<h4 class="font-semibold text-sm">Generated Lesson Plan Summary</h4>
							</div>
							
							<div class="space-y-3">
								<div class="p-3 bg-white/50 rounded-lg border">
									<h5 class="font-medium text-sm mb-2">{generatedLessonPlan.name}</h5>
									<p class="text-sm text-muted-foreground">{generatedLessonPlan.summary}</p>
								</div>
								
								<div class="text-xs text-muted-foreground">
									This is a preview of your lesson plan. If you like it, click "Create Lesson Plan" to see the complete details and create it.
								</div>
								
								<div class="flex gap-2 w-full">
									<Button 
										type="button" 
										size="sm" 
										class="flex-1"
										disabled={isCreatingLessonPlan}
										onclick={() => {
											// Generate full lesson plan
											const createForm = new FormData();
											createForm.set('planData', JSON.stringify(generatedLessonPlan));
											if (form?.imageBase64) {
												createForm.set('imageBase64', form.imageBase64);
											}
											
											isCreatingLessonPlan = true;
											fetch('?/createLessonPlan', {
												method: 'POST',
												body: createForm
											}).then(async (response) => {
												const result = await response.json();
												if (result.type === 'success') {
													lessonPlanDrawerOpen = false;
													lessonPlanDescription = '';
													generatedLessonPlan = null;
													currentInstruction = '';
													invalidateAll();
												}
												isCreatingLessonPlan = false;
											}).catch(() => {
												isCreatingLessonPlan = false;
											});
										}}
									>
										{#if isCreatingLessonPlan}
											<RefreshCw class="w-3 h-3 mr-1 animate-spin" />
											Creating...
										{:else}
											Create Lesson Plan
										{/if}
									</Button>
									<Button 
										type="button" 
										size="sm" 
										variant="outline"
										disabled={isGeneratingLesson}
										onclick={() => {
											// Regenerate with the same instruction
											isGeneratingLesson = true;
											const formData = new FormData();
											formData.set('instruction', currentInstruction);
											
											fetch('?/generateLessonPlanResponse', {
												method: 'POST',
												body: formData
											}).then(async (response) => {
												const result = await response.json();
												if (result.type === 'success' && result.data) {
													generatedLessonPlan = result.data.planData;
												}
												isGeneratingLesson = false;
											}).catch(() => {
												isGeneratingLesson = false;
											});
										}}
									>
										{#if isGeneratingLesson}
											<RefreshCw class="w-3 h-3 mr-1 animate-spin" />
											Regenerating...
										{:else}
											Regenerate
										{/if}
									</Button>
								</div>
							</div>
						</div>
					{/if}
					
					<form method="POST" action="?/generateLessonPlanResponse" use:enhance={() => {
						isGeneratingLesson = true;
						return async ({ result, update }) => {
							isGeneratingLesson = false;
							if (result.type === 'success' && result.data) {
								generatedLessonPlan = result.data.planData;
								currentInstruction = (result.data.instruction as string) || lessonPlanDescription;
							}
							await update();
						};
					}} class="space-y-3">
					
						<div class="space-y-2">
							<div class="space-y-2">
								<Label for="lesson-description" class="text-sm font-medium">
									{#if generatedLessonPlan}
										Describe a different lesson idea:
									{:else}
										What should this lesson plan cover?
									{/if}
								</Label>
								<Textarea 
									id="lesson-description" 
									name="instruction"
									bind:value={lessonPlanDescription} 
									placeholder={generatedLessonPlan 
										? "Describe a different lesson plan..." 
										: "E.g., 'Introduction to photosynthesis with hands-on plant experiments for year 7 students' or 'Creative writing workshop focusing on character development using short story techniques'"
									}
									class={generatedLessonPlan ? "min-h-[40px] resize-y" : "min-h-[120px] resize-none"}
									required
								/>
								{#if !generatedLessonPlan}
									<p class="text-xs text-muted-foreground">
										Be specific about the topic, activities, and any particular learning objectives you want to include.
									</p>
								{/if}
							</div>
						</div>
						
						<div class="flex gap-3">
							{#if generatedLessonPlan}
								<Button 
									type="submit"
									disabled={isGeneratingLesson || !lessonPlanDescription.trim()}
									class="flex-1 gap-2"
									onclick={() => {
										// Clear current plan to regenerate with new description
										generatedLessonPlan = null;
									}}
								>
									{#if isGeneratingLesson}
										<RefreshCw class="w-4 h-4 animate-spin" />
										Generating New Plan...
									{:else}
										<Sparkles class="w-4 h-4" />
										Generate Different Plan
									{/if}
								</Button>
								<Button type="button" variant="outline" onclick={() => console.log('Create manually')}>
									Manual
								</Button>
							{:else}
								<Button 
									type="submit"
									disabled={isGeneratingLesson || !lessonPlanDescription.trim()}
									class="flex-1 gap-2"
								>
									{#if isGeneratingLesson}
										<RefreshCw class="w-4 h-4 animate-spin" />
										Generating Summary...
									{:else}
										<Sparkles class="w-4 h-4" />
										Generate Summary with AI
									{/if}
								</Button>
								<Button type="button" variant="outline" onclick={() => console.log('Create manually')}>
									Manual
								</Button>
							{/if}
						</div>
						
						{#if form?.message}
							<div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
								<p class="text-sm text-destructive">{form.message}</p>
							</div>
						{/if}
					</form>
				</SheetContent>
			</Sheet>
		</div>
		
		{#if data.lessonPlans.length > 0}
			<div class="flex flex-wrap gap-4 justify-start">
				{#each data.lessonPlans as plan}
					<LessonPlanCard 
						lessonPlan={plan} 
						href={`${page.url.pathname}/lesson-plans/${plan.id}`} 
					/>
				{/each}
			</div>
		{:else}
			<div class="text-center py-12">
				<svg class="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<p class="text-muted-foreground">No lesson plans yet. Create your first one!</p>
			</div>
		{/if}
	</div>

	<!-- Assessment Plans Section -->
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-semibold">Assessment Plans</h2>
			<Sheet>
				<SheetTrigger >
					<Button variant="outline" class="gap-2">
						<Plus class="w-4 h-4" />
						Assessment Plan 
					</Button>
				</SheetTrigger>
		   <SheetContent class="w-[600px] max-w-[90vw] p-6 space-y-6">
					<SheetHeader>
						<SheetTitle>Create New Assessment Plan</SheetTitle>
					</SheetHeader>
					<div class="space-y-6">
						<div class="space-y-2">
							<Label for="assessment-title">Title</Label>
							<Input id="assessment-title" bind:value={assessmentPlanTitle} placeholder="Enter assessment plan title" />
						</div>
						<div class="space-y-2">
							<Label for="assessment-description">What should this assessment plan cover?</Label>
							<Textarea 
								id="assessment-description" 
								bind:value={assessmentPlanDescription} 
								placeholder="Describe what you want this assessment plan to be about..."
								class="min-h-32" 
							/>
						</div>
						
						{#if generatedAssessmentPlan}
							<div class="space-y-4 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
								<div class="flex items-center gap-2 mb-3">
									<div class="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
										<Sparkles class="w-3 h-3 text-primary" />
									</div>
									<h4 class="font-semibold text-sm">Generated Assessment Plan</h4>
								</div>
								<p class="text-sm text-muted-foreground">{generatedAssessmentPlan}</p>
								<div class="flex gap-2">
									<Button size="sm" onclick={() => console.log('Create assessment plan')}>Create</Button>
									<Button size="sm" variant="outline" onclick={() => generateAssessmentPlan()}>Regenerate</Button>
								</div>
							</div>
						{:else}
							<div class="flex gap-2">
								<Button 
									onclick={generateAssessmentPlan} 
									disabled={isGeneratingAssessment || !assessmentPlanTitle || !assessmentPlanDescription}
									class="flex-1"
								>
									{#if isGeneratingAssessment}
										Generating...
									{:else}
										Generate with AI
									{/if}
								</Button>
								<Button variant="outline" onclick={() => console.log('Create manually')}>
									Create Manually
								</Button>
							</div>
						{/if}
					</div>
				</SheetContent>
			</Sheet>
		</div>
		
		{#if data.assessmentPlans.length > 0}
			<div class="grid md:grid-cols-2 gap-6">
				{#each data.assessmentPlans as plan}
					<Card.Root class="hover:shadow-md transition-shadow">
						<Card.Header>
							<Card.Title>{plan.name}</Card.Title>
							{#if plan.description}
								<Card.Description>{plan.description}</Card.Description>
							{/if}
						</Card.Header>
					</Card.Root>
				{/each}
			</div>
		{:else}
			<div class="text-center py-12">
				<svg class="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
				</svg>
				<p class="text-muted-foreground">No assessment plans yet. Create your first one!</p>
			</div>
		{/if}
	</div>
</div>
