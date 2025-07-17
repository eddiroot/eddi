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
	
	let { data, form } = $props();
	let lessonPlanDescription = $state('');
	let assessmentPlanTitle = $state('');
	let assessmentPlanDescription = $state('');
	let isGeneratingLesson = $state(false);
	let isGeneratingAssessment = $state(false);
	let generatedLessonPlan = $state<any>(null);
	let generatedAssessmentPlan = $state<string | null>(null);
	let lessonPlanDrawerOpen = $state(false);
	
	// Handle form response
	$effect(() => {
		if (form?.success && form?.lessonPlan) {
			lessonPlanDrawerOpen = false;
			lessonPlanDescription = '';
			generatedLessonPlan = null;
			invalidateAll();
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
		<h1 class="text-4xl font-bold mb-2">{data.courseMapItem.topic}</h1>
		<div class="flex flex-wrap items-center justify-center gap-6 text-sm">
			<div class="flex items-center gap-1">
				<Calendar class="w-4 h-4" />
				Week {data.courseMapItem.startWeek}
			</div>
			<div class="flex items-center gap-1">
				<Clock class="w-4 h-4" />
				{data.courseMapItem.duration} weeks
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
</div>

<div class="max-w-4xl mx-auto px-6 space-y-12">
	<!-- Description Section -->
	{#if data.courseMapItem.description}
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Description</h2>
			<p class="text-muted-foreground leading-relaxed">{data.courseMapItem.description}</p>
		</div>
	{/if}

	<!-- Curriculum Learning Areas -->
	{#if data.learningAreas.length > 0}
		<div class="space-y-6">
			<h2 class="text-2xl font-semibold">Curriculum Learning Areas</h2>
			<div class="flex flex-wrap gap-4">
				{#each data.learningAreas as la}
					<VcaaLearningAreaCard learningAreaName={la.name} />
				{/each}
			</div>
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
				<SheetContent class="w-[600px] max-w-[90vw]">
					<SheetHeader class="space-y-3">
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
					
					<form method="POST" action="?/createLessonPlan" use:enhance={() => {
						isGeneratingLesson = true;
						return async ({ result, update }) => {
							isGeneratingLesson = false;
							if (result.type === 'success') {
								generatedLessonPlan = result.data?.lessonPlan;
							}
							await update();
						};
					}} class="space-y-6 mt-6">
						
						<div class="space-y-4">
							<div class="space-y-2">
								<Label for="lesson-description" class="text-sm font-medium">What should this lesson plan cover?</Label>
								<Textarea 
									id="lesson-description" 
									name="instruction"
									bind:value={lessonPlanDescription} 
									placeholder="E.g., 'Introduction to photosynthesis with hands-on plant experiments for year 7 students' or 'Creative writing workshop focusing on character development using short story techniques'"
									class="min-h-[120px] resize-none" 
									required
								/>
								<p class="text-xs text-muted-foreground">
									Be specific about the topic, activities, and any particular learning objectives you want to include.
								</p>
							</div>
						</div>
						
						{#if generatedLessonPlan}
							<div class="space-y-4 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
								<div class="flex items-center gap-2 mb-3">
									<div class="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
										<Sparkles class="w-3 h-3 text-primary" />
									</div>
									<h4 class="font-semibold text-sm">Generated Lesson Plan</h4>
								</div>
								
								<div class="space-y-3">
									<div>
										<h5 class="font-medium text-sm mb-1">{generatedLessonPlan.name}</h5>
										<p class="text-sm text-muted-foreground">{generatedLessonPlan.description}</p>
									</div>
									
									{#if generatedLessonPlan.scopes && generatedLessonPlan.scopes.length > 0}
										<div class="space-y-2">
											<h6 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lesson Structure</h6>
											<div class="space-y-1">
												{#each generatedLessonPlan.scopes as scope, i}
													<div class="flex gap-2 text-sm">
														<span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
															{i + 1}
														</span>
														<div>
															<span class="font-medium">{scope.title}:</span>
															<span class="text-muted-foreground ml-1">{scope.details}</span>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
								
								<div class="flex gap-2 pt-3 border-t border-primary/20">
									<Button type="submit" size="sm" class="flex-1">
										Create Lesson Plan
									</Button>
									<Button 
										type="submit" 
										size="sm" 
										variant="outline"
										onclick={() => {
											generatedLessonPlan = null;
										}}
									>
										<RefreshCw class="w-3 h-3 mr-1" />
										Regenerate
									</Button>
								</div>
							</div>
						{:else}
							<div class="flex gap-3">
								<Button 
									type="submit"
									disabled={isGeneratingLesson || !lessonPlanDescription.trim()}
									class="flex-1 gap-2"
								>
									{#if isGeneratingLesson}
										<RefreshCw class="w-4 h-4 animate-spin" />
										Generating...
									{:else}
										<Sparkles class="w-4 h-4" />
										Generate with AI
									{/if}
								</Button>
								<Button type="button" variant="outline" onclick={() => console.log('Create manually')}>
									Manual
								</Button>
							</div>
						{/if}
						
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
			<div class="grid md:grid-cols-2 gap-6">
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
				<SheetContent class="w-96">
					<SheetHeader>
						<SheetTitle>Create New Assessment Plan</SheetTitle>
					</SheetHeader>
					<div class="space-y-6 mt-6">
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
							<div class="space-y-4 p-4 bg-muted rounded-lg">
								<h4 class="font-medium">Generated Assessment Plan Preview:</h4>
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
