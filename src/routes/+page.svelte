<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import TagIcon from '@lucide/svelte/icons/tag';
	import TargetIcon from '@lucide/svelte/icons/target';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
</script>

<!-- Main Hero Section -->
<section class="py-16 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 lg:px-8">
		<div class="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12 xl:gap-20">
			<div class="space-y-6">
				<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
					Redefining how schools work
				</h1>
				<p class="text-muted-foreground text-xl">
					with a <strong>modern</strong> approach to education
				</p>
				<div class="flex flex-col gap-3 sm:flex-row">
					<Button size="lg" variant="outline">Watch the demo</Button>
					<Button href="/onboarding" size="lg">Get started</Button>
				</div>
			</div>
			<div class="order-first md:order-last">
				<img
					class="h-auto w-full rounded-lg shadow-xl dark:shadow-gray-800"
					src="/hero-clay-students.jpeg"
					alt="Students using laptops"
				/>
			</div>
		</div>
	</div>
</section>

<!-- Discussions Section -->
<section class="bg-muted/50 py-16 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 lg:px-8">
		<div class="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12 xl:gap-20">
			<div class="space-y-6">
				<h2 class="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
					Foster meaningful discussions
				</h2>
				<p class="text-muted-foreground text-xl">
					Create a collaborative learning environment with a structured discussion system.
				</p>
				<ul class="space-y-3 text-lg">
					<li class="flex items-center">
						<MessageCircleIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Threaded discussion format
					</li>
					<li class="flex items-center">
						<ThumbsUpIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Upvoting and answer validation
					</li>
					<li class="flex items-center">
						<TagIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Topic tagging and search
					</li>
				</ul>
			</div>
			<div>
				<img
					class="h-auto w-full rounded-lg shadow-xl dark:shadow-gray-800"
					src="/hero-discussions.png"
					alt="Discussion interface"
				/>
			</div>
		</div>
	</div>
</section>

<!-- Lessons Section -->
<section class="py-16 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 lg:px-8">
		<div class="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12 xl:gap-20">
			<div class="order-last md:order-first">
				<img
					class="h-auto w-full rounded-lg shadow-xl dark:shadow-gray-800"
					src="/hero-discussions.png"
					alt="Lesson creation interface"
				/>
			</div>
			<div class="space-y-6">
				<h2 class="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
					Engage students with interactive lessons
				</h2>
				<p class="text-muted-foreground text-xl">
					Use a drag-and-drop editor with AI assistance to speed up task creation.
				</p>
				<ul class="space-y-3 text-lg">
					<li class="flex items-center">
						<TargetIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Auto-generate learning objectives
					</li>
					<li class="flex items-center">
						<FileTextIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Content suggestions and templates
					</li>
					<li class="flex items-center">
						<RefreshCwIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Instant content refinement
					</li>
				</ul>
				<div>
					<Button variant="default" size="lg">Start creating</Button>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Built-in Tutoring Section -->
<section class="bg-muted/50 py-16 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 lg:px-8">
		<div class="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12 xl:gap-20">
			<div class="space-y-6">
				<h2 class="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
					Meet eddi, your personal tutor
				</h2>
				<p class="text-muted-foreground text-xl">
					Give your students personalised help 24/7 with their own personal tutor that knows their
					lessons and progress.
				</p>
				<ul class="space-y-3 text-lg">
					<li class="flex items-center">
						<MessageSquareIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Instant answers to your questions
					</li>
					<li class="flex items-center">
						<BookOpenIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Personalised learning recommendations
					</li>
					<li class="flex items-center">
						<TrendingUpIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Study plan optimisation
					</li>
				</ul>
			</div>
			<div>
				<img
					class="h-auto w-full rounded-lg shadow-xl dark:shadow-gray-800"
					src="/hero-discussions.png"
					alt="Built-in tutor called eddi"
				/>
			</div>
		</div>
	</div>
</section>

<!-- Announcements Section -->
<section class="py-16 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 lg:px-8">
		<div class="grid gap-8 md:grid-cols-2 md:items-center lg:gap-12 xl:gap-20">
			<div class="order-last md:order-first">
				<img
					class="h-auto w-full rounded-lg shadow-xl dark:shadow-gray-800"
					src="/hero-discussions.png"
					alt="Announcements interface"
				/>
			</div>
			<div class="space-y-6">
				<h2 class="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
					Keep everyone informed
				</h2>
				<p class="text-muted-foreground text-xl">
					Share important updates and announcements with your class instantly.
				</p>
				<ul class="space-y-3 text-lg">
					<li class="flex items-center">
						<MegaphoneIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Instant push notifications
					</li>
					<li class="flex items-center">
						<CalendarIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Schedule announcements
					</li>
					<li class="flex items-center">
						<TargetIcon class="mr-3 h-5 w-5 flex-shrink-0" />
						Target specific groups
					</li>
				</ul>
			</div>
		</div>
	</div>
</section>
