<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { type TaskBlock } from '$lib/server/db/schema';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import XIcon from '@lucide/svelte/icons/x';
	import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
	import PlayIcon from '@lucide/svelte/icons/play';
	import StopCircleIcon from '@lucide/svelte/icons/stop-circle';
	import UsersIcon from '@lucide/svelte/icons/users';
	import PresentationIcon from '@lucide/svelte/icons/presentation';
	import { ViewMode } from '$lib/utils';

	// Import all block components
	import Heading from '../blocks/heading.svelte';
	import RichTextEditor from '../blocks/rich-text-editor.svelte';
	import Image from '../blocks/image.svelte';
	import Video from '../blocks/video.svelte';
	import Audio from '../blocks/audio.svelte';
	import Whiteboard from '../blocks/whiteboard.svelte';
	import MultipleChoice from '../blocks/multiple-choice.svelte';
	import FillInBlank from '../blocks/fill-in-blank.svelte';
	import Matching from '../blocks/matching.svelte';
	import TwoColumnLayout from '../blocks/two-column-layout.svelte';
	import ShortAnswer from '../blocks/short-answer.svelte';

	let { data } = $props();
	let blocks = $state(data.blocks as TaskBlock[]);
	let currentSlide = $state(0);
	let isFullscreen = $state(false);
	
	// Presentation state
	let isPresenting = $state(data.isPresenting || false);
	let presentationSocket = $state<WebSocket | null>(null);
	let connectedStudents = $state<Array<{ studentId: string; studentName?: string }>>([]);
	let studentAnswers = $state<Array<{
		questionId: string;
		answer: string;
		studentId: string;
		studentName?: string;
		slideIndex: number;
		timestamp: Date;
	}>>([]);
	
	// Student-specific state
	let isInPresentation = $state(false);
	let isStudent = $derived(data.user.type === 'student');
	
	// Current slide answers (for teachers)
	const currentSlideAnswers = $derived(() => {
		return studentAnswers.filter(answer => answer.slideIndex === currentSlide);
	});
	
	// Form enhancement for starting/ending presentation
	let isLoading = $state(false);

	// Common response props for all interactive blocks (needed for students)
	const responseProps = $derived({
		taskId: data.task.id,
		classTaskId: data.classTask.id,
		subjectOfferingId: data.subjectOfferingId,
		subjectOfferingClassId: data.subjectOfferingClassId,
		isPublished: data.classTask.status === 'published'
	});

	// Group consecutive headings into slides
	let slides = $derived(() => {
		const grouped: TaskBlock[][] = [];
		let currentGroup: TaskBlock[] = [];

		for (const block of blocks) {
			const isHeading = block.type.startsWith('h') && block.type.match(/^h[1-6]$/);
			const isMarkdown = block.type === 'markdown';

			if (isHeading) {
				currentGroup.push(block);
			} else if (block.type === 'markdown') {
				currentGroup.push(block);
			} else {
				if (currentGroup.length > 0) {
					grouped.push([...currentGroup]);
				}
				grouped.push([block]);
				currentGroup = [];
			}
		}

		// Add final group if it has content
		if (currentGroup.length > 0) {
			grouped.push(currentGroup);
		}

		// Add title slide as the first slide
		return [[], ...grouped]; // Empty array represents the title slide
	});

	// Navigation functions
	function nextSlide() {
		// Only allow navigation for teachers or when not in student presentation mode
		if (isStudent && isInPresentation) return;
		
		if (currentSlide < slides().length - 1) {
			currentSlide++;
			// Send slide change to students if this is a teacher
			if (!isStudent && presentationSocket?.readyState === WebSocket.OPEN) {
				sendSlideChange(currentSlide);
			}
		}
	}

	function prevSlide() {
		// Only allow navigation for teachers or when not in student presentation mode
		if (isStudent && isInPresentation) return;
		
		if (currentSlide > 0) {
			currentSlide--;
			// Send slide change to students if this is a teacher
			if (!isStudent && presentationSocket?.readyState === WebSocket.OPEN) {
				sendSlideChange(currentSlide);
			}
		}
	}

	function goToSlide(index: number) {
		// Only allow navigation for teachers or when not in student presentation mode
		if (isStudent && isInPresentation) return;
		
		if (index >= 0 && index < slides().length) {
			currentSlide = index;
			// Send slide change to students if this is a teacher
			if (!isStudent && presentationSocket?.readyState === WebSocket.OPEN) {
				sendSlideChange(currentSlide);
			}
		}
	}
	
	// Send slide change notification to students
	function sendSlideChange(slideIndex: number) {
		if (presentationSocket?.readyState === WebSocket.OPEN) {
			presentationSocket.send(JSON.stringify({
				type: 'slide_changed',
				taskId: data.task.id,
				slideIndex,
				teacherId: data.user.id
			}));
		}
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		// Disable keyboard navigation for students in presentation mode
		if (isStudent && isInPresentation) {
			// Only allow escape to exit fullscreen
			if (event.key === 'Escape') {
				event.preventDefault();
				exitFullscreen();
			}
			return;
		}
		
		switch (event.key) {
			case 'ArrowRight':
			case ' ':
				event.preventDefault();
				nextSlide();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				prevSlide();
				break;
			case 'Escape':
				event.preventDefault();
				exitFullscreen();
				break;
			case 'f':
			case 'F':
				event.preventDefault();
				toggleFullscreen();
				break;
		}
	}

	// Presentation WebSocket functions
	function connectToPresentation() {
		if (!browser) return;
		
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/api/presentations/ws`;
		
		presentationSocket = new WebSocket(wsUrl);
		
		presentationSocket.onopen = () => {
			console.log('Connected to presentation WebSocket');
		};
		
		presentationSocket.onmessage = (event) => {
			const message = JSON.parse(event.data);
			handlePresentationMessage(message);
		};
		
		presentationSocket.onclose = () => {
			console.log('Disconnected from presentation WebSocket');
			presentationSocket = null;
		};
		
		presentationSocket.onerror = (error) => {
			console.error('Presentation WebSocket error:', error);
		};
	}
	
	function disconnectFromPresentation() {
		if (presentationSocket) {
			presentationSocket.close();
			presentationSocket = null;
		}
	}
	
	function handlePresentationMessage(message: any) {
		switch (message.type) {
			case 'presentation_started':
				console.log('Presentation started');
				if (isStudent) {
					isInPresentation = true;
				}
				break;
				
			case 'joined_presentation':
				if (isStudent) {
					isInPresentation = true;
					console.log('Successfully joined presentation');
				}
				break;
				
			case 'presentation_not_found':
				if (isStudent) {
					console.log('Presentation not found');
					isInPresentation = false;
				}
				break;
				
			case 'student_joined':
				// Only handle this for teachers
				if (!isStudent) {
					const existingStudent = connectedStudents.find(s => s.studentId === message.studentId);
					if (!existingStudent) {
						connectedStudents.push({
							studentId: message.studentId,
							studentName: message.studentName
						});
						connectedStudents = [...connectedStudents]; // Trigger reactivity
					}
				}
				break;
				
			case 'new_answer':
				// Only handle this for teachers
				if (!isStudent) {
					// Update student answers
					const answerIndex = studentAnswers.findIndex(
						a => a.studentId === message.studentId && a.questionId === message.questionId
					);
					
					if (answerIndex >= 0) {
						studentAnswers[answerIndex] = {
							questionId: message.questionId,
							answer: message.answer,
							studentId: message.studentId,
							studentName: message.studentName,
							slideIndex: message.slideIndex ?? 0,
							timestamp: new Date(message.timestamp)
						};
					} else {
						studentAnswers.push({
							questionId: message.questionId,
							answer: message.answer,
							studentId: message.studentId,
							studentName: message.studentName,
							slideIndex: message.slideIndex ?? 0,
							timestamp: new Date(message.timestamp)
						});
					}
					studentAnswers = [...studentAnswers]; // Trigger reactivity
				}
				break;
			
		case 'slide_changed':
			// Only handle this for students
			if (isStudent && isInPresentation) {
				console.log('Teacher changed slide to:', message.slideIndex);
				currentSlide = message.slideIndex;
			}
			break;
			
		case 'presentation_ended':
			isPresenting = false;
			isInPresentation = false;
			connectedStudents = [];
			studentAnswers = [];
			disconnectFromPresentation();
			break;
				
			case 'error':
				console.error('Presentation error:', message.message);
				break;
		}
	}
	
	function startPresentationWebSocket() {
		if (presentationSocket) return;
		
		connectToPresentation();
		
		// Wait for connection then start presentation
		const checkConnection = setInterval(() => {
			if (presentationSocket?.readyState === WebSocket.OPEN) {
				clearInterval(checkConnection);
				presentationSocket.send(JSON.stringify({
					type: 'start_presentation',
					taskId: data.task.id,
					teacherId: data.user.id,
					teacherName: `${data.user.firstName} ${data.user.lastName}`
				}));
			}
		}, 100);
	}
	
	function endPresentationWebSocket() {
		if (presentationSocket?.readyState === WebSocket.OPEN) {
			presentationSocket.send(JSON.stringify({
				type: 'end_presentation',
				taskId: data.task.id,
				teacherId: data.user.id
			}));
		}
		disconnectFromPresentation();
	}

	// Student functions
	function joinPresentationAsStudent() {
		if (!browser || presentationSocket) return;
		
		connectToPresentation();
		
		// Wait for connection then join presentation
		const checkConnection = setInterval(() => {
			if (presentationSocket?.readyState === WebSocket.OPEN) {
				clearInterval(checkConnection);
				presentationSocket.send(JSON.stringify({
					type: 'join_presentation',
					taskId: data.task.id,
					studentId: data.user.id,
					studentName: `${data.user.firstName} ${data.user.lastName}`
				}));
			}
		}, 100);
	}
	
	function submitAnswerToPresentation(questionId: string, answer: string) {
		console.log('submitAnswerToPresentation called:', {
			questionId,
			answer,
			socketState: presentationSocket?.readyState,
			isOpen: presentationSocket?.readyState === WebSocket.OPEN,
			currentSlide
		});
		
		if (presentationSocket?.readyState === WebSocket.OPEN) {
			const message = {
				type: 'submit_answer',
				taskId: data.task.id,
				questionId,
				answer,
				slideIndex: currentSlide,
				studentId: data.user.id,
				studentName: `${data.user.firstName} ${data.user.lastName}`
			};
			console.log('Sending answer message:', message);
			presentationSocket.send(JSON.stringify(message));
		} else {
			console.log('WebSocket not open, cannot submit answer');
		}
	}

	// Fullscreen functionality
	function toggleFullscreen() {
		if (!browser) return;

		if (!isFullscreen) {
			document.documentElement.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	}

	function exitFullscreen() {
		if (!browser) return;
		if (document.fullscreenElement) {
			document.exitFullscreen?.();
		}
	}

	onMount(() => {
		if (browser) {
			// Listen for fullscreen changes
			const handleFullscreenChange = () => {
				isFullscreen = !!document.fullscreenElement;
			};

			document.addEventListener('fullscreenchange', handleFullscreenChange);
			document.addEventListener('keydown', handleKeydown);
			
			// If already presenting (teacher), connect to WebSocket
			if (isPresenting && !isStudent) {
				startPresentationWebSocket();
			}
			
			// If student and there's an active presentation, join it
			if (isStudent && data.isPresenting) {
				joinPresentationAsStudent();
			}
			
			return () => {
				document.removeEventListener('fullscreenchange', handleFullscreenChange);
				document.removeEventListener('keydown', handleKeydown);
			};
		}
	});
	
	onDestroy(() => {
		disconnectFromPresentation();
	});
</script>

<svelte:head>
	<title>{data.task.title} - Presentation</title>
</svelte:head>

<div class="fixed h-screen top-0 left-0 z-50 w-screen bg-gray-900 text-white">
	<!-- Small Connection Status in Top-Left Corner (Students Only) -->
	{#if isStudent}
		<div class="absolute top-4 left-4 z-10">
			{#if isInPresentation}
				<div class="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium shadow-md">
					<div class="h-2 w-2 bg-green-200 rounded-full animate-pulse"></div>
					Connected
				</div>
			{:else if data.isPresenting}
				<div class="bg-yellow-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium shadow-md">
					<div class="h-2 w-2 bg-yellow-200 rounded-full animate-pulse"></div>
					Connecting...
				</div>
			{/if}
		</div>
	{/if}

	<div class="h-full">
		{#if slides().length > 0}
			<Card.Root class="h-full rounded-none bg-white">
				<Card.Content class="h-full p-8">
					{@const currentSlideBlocks = slides()[currentSlide]}

					<!-- Title slide (first slide) -->
					{#if currentSlide === 0}
						<div class="flex h-full flex-col items-center justify-center text-center">
							<h1 class="mb-8 text-6xl font-bold text-gray-900">{data.task.title}</h1>
							<div class="text-xl text-gray-600">
								{slides().length - 1} slides
							</div>
						</div>
					{:else}
						<!-- Render all blocks in the current slide -->
						{#each currentSlideBlocks as block, blockIndex}
							<div class="mb-6 {blockIndex === currentSlideBlocks.length - 1 ? 'mb-0' : ''}">
								<!-- Render the current block -->
								{#if block.type === 'h1'}
									<Heading
										headingSize={parseInt(block.type[1]) + 1}
										text={typeof block.content === 'string' ? block.content : 'This is a heading'}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
									/>
								{:else if block.type === 'h2' || block.type === 'h3' || block.type === 'h4' || block.type === 'h5' || block.type === 'h6'}
									<Heading
										headingSize={parseInt(block.type[1]) + 1}
										text={typeof block.content === 'string' ? block.content : 'This is a heading'}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
									/>
								{:else if block.type === 'markdown'}
									<RichTextEditor
										initialContent={block.content as string | undefined}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
									/>
								{:else if block.type === 'image'}
									<Image
										content={block.content as Record<string, any> | undefined}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
									/>
								{:else if block.type === 'video'}
									<Video
										content={block.content as Record<string, any> | undefined}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
									/>
								{:else if block.type === 'audio'}
									<Audio
										content={block.content as Record<string, any> | undefined}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
									/>
								{:else if block.type === 'whiteboard'}
									<Whiteboard
										content={block.content as Record<string, any> | undefined}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
									/>
								{:else if block.type === 'multiple_choice'}
									<MultipleChoice
										content={block.content as any}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
										blockId={block.id}
										{...responseProps}
										role={isStudent ? 'student' : 'teacher'}
										onPresentationAnswer={isStudent && isInPresentation 
											? (answer: string) => submitAnswerToPresentation(`block-${block.id}`, answer)
											: undefined}
										studentResponses={!isStudent 
											? currentSlideAnswers().filter(answer => answer.questionId === `block-${block.id}`)
											: []}
										showResponseChart={!isStudent && isPresenting && connectedStudents.length > 0}
									/>
								{:else if block.type === 'fill_in_blank'}
									<FillInBlank
										content={block.content as any}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
										blockId={block.id}
										{...responseProps}
										role={isStudent ? 'student' : 'teacher'}
										onPresentationAnswer={isStudent && isInPresentation 
											? (answer: string) => submitAnswerToPresentation(`block-${block.id}`, answer)
											: undefined}
										studentResponses={!isStudent 
											? currentSlideAnswers().filter(answer => answer.questionId === `block-${block.id}`)
											: []}
										showResponseChart={!isStudent && isPresenting && connectedStudents.length > 0}
									/>
								{:else if block.type === 'matching'}
									<Matching
										content={block.content as any}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
										blockId={block.id}
										{...responseProps}
										onPresentationAnswer={isStudent && isInPresentation 
											? (answer: string) => submitAnswerToPresentation(`block-${block.id}`, answer)
											: undefined}
									/>
								{:else if block.type === 'two_column_layout'}
									<TwoColumnLayout
										content={block.content as any}
										viewMode={ViewMode.PRESENT}
										onUpdate={async () => {}}
										onGlobalDrop={async () => {}}
										blockId={block.id}
										{...responseProps}
									/>
								{:else if block.type === 'short_answer'}
									<ShortAnswer
										content={block.content as any}
										viewMode={ViewMode.PRESENT}
										onUpdate={() => {}}
										blockId={block.id}
										{...responseProps}
										onPresentationAnswer={isStudent && isInPresentation 
											? (answer: string) => submitAnswerToPresentation(`block-${block.id}`, answer)
											: undefined}
									/>
								{:else}
									<div class="text-center text-gray-500">
										<p>Content for {block.type} block.</p>
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="flex h-full items-center justify-center bg-gray-100">
				<p class="text-xl text-gray-500">No slides to display</p>
			</div>
		{/if}
		</div>

	<!-- Left Navigation Arrow -->
	{#if currentSlide > 0 && !isStudent}
		<button
			class="bg-opacity-50 hover:bg-opacity-70 absolute top-1/2 left-4 -translate-y-1/2 transform rounded-full bg-black p-3 text-white transition-all duration-200"
			onclick={prevSlide}
		>
			<ChevronLeftIcon class="h-6 w-6" />
		</button>
	{/if}

	<!-- Right Navigation Arrow -->
	{#if currentSlide < slides().length - 1 && !isStudent}
		<button
			class="bg-opacity-50 hover:bg-opacity-70 absolute top-1/2 right-4 -translate-y-1/2 transform rounded-full bg-black p-3 text-white transition-all duration-200"
			onclick={nextSlide}
		>
			<ChevronRightIcon class="h-6 w-6" />
		</button>
	{/if}

	<!-- Bottom Navigation Overlay -->
	<div class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
		<div class="flex items-center justify-between text-white">
			<!-- Task Info and Presentation Status -->
			<div class="flex items-center gap-4">
				<h1 class="text-lg font-semibold">{data.task.title}</h1>
				<div class="text-sm opacity-80">
					{currentSlide + 1} / {slides().length}
				</div>
				
				<!-- Presentation Status -->
				{#if isPresenting && !isStudent}
					<div class="flex items-center gap-2 bg-green-600 bg-opacity-80 px-3 py-1 rounded-full">
						<div class="h-2 w-2 bg-green-300 rounded-full animate-pulse"></div>
						<span class="text-sm">Live</span>
						{#if connectedStudents.length > 0}
							<UsersIcon class="h-4 w-4" />
							<span class="text-sm">{connectedStudents.length}</span>
						{/if}
					</div>
				{:else if isStudent && isInPresentation}
					<div class="flex items-center gap-2 bg-blue-600 bg-opacity-80 px-3 py-1 rounded-full">
						<div class="h-2 w-2 bg-blue-300 rounded-full animate-pulse"></div>
						<span class="text-sm">Following Teacher</span>
					</div>
				{/if}
			</div>

			<!-- Controls -->
			<div class="flex items-center gap-2">
				<!-- Presentation Controls (Teachers Only) -->
				{#if !isStudent}
					{#if !isPresenting}
						<form method="POST" action="?/start_presentation" use:enhance={({ formData }) => {
							isLoading = true;
							return async ({ result }) => {
								isLoading = false;
								if (result.type === 'success') {
									isPresenting = true;
									startPresentationWebSocket();
								}
							};
						}}>
							<Button 
								type="submit"
								variant="default" 
								size="sm" 
								disabled={isLoading}
								class="bg-blue-600 hover:bg-blue-700 text-white"
							>
								<PlayIcon class="h-4 w-4 mr-2" />
								Start Presentation
							</Button>
						</form>
					{:else}
						<form method="POST" action="?/end_presentation" use:enhance={({ formData }) => {
							isLoading = true;
							return async ({ result }) => {
								isLoading = false;
								if (result.type === 'success') {
									isPresenting = false;
									endPresentationWebSocket();
									connectedStudents = [];
									studentAnswers = [];
								}
							};
						}}>
							<Button 
								type="submit"
								variant="destructive" 
								size="sm" 
								disabled={isLoading}
								class="bg-red-600 hover:bg-red-700 text-white"
							>
								<StopCircleIcon class="h-4 w-4 mr-2" />
								End Presentation
							</Button>
						</form>
					{/if}
				{/if}
				
				<!-- Slide Dots (Teachers only during presentation or everyone when not presenting) -->
				{#if !(isStudent && isInPresentation)}
					<div class="mr-4 flex items-center gap-1">
						{#each slides() as _, index}
							<button
								class="h-2 w-2 rounded-full transition-colors {index === currentSlide
									? 'bg-white'
									: 'bg-opacity-40 hover:bg-opacity-60 bg-white'}"
								onclick={() => goToSlide(index)}
								title="Go to slide {index + 1}"
								aria-label="Go to slide {index + 1}"
							></button>
						{/each}
					</div>
				{/if}

				<!-- Fullscreen toggle -->
				<Button
					variant="ghost"
					size="sm"
					onclick={toggleFullscreen}
					class="hover:bg-opacity-20 text-white hover:bg-white"
				>
					<Maximize2Icon class="h-4 w-4" />
				</Button>

				<!-- Exit presentation -->
				<Button
					variant="ghost"
					size="sm"
					href="../"
					class="hover:bg-opacity-20 text-white hover:bg-white"
				>
					<XIcon class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
</div>

<!-- Fullscreen Styles -->
<style>
	:global(html:fullscreen) {
		background: rgb(17 24 39); /* gray-900 */
	}

	:global(html:fullscreen body) {
		background: rgb(17 24 39); /* gray-900 */
	}
</style>
