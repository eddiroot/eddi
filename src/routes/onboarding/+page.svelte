<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
</script>

<div class="flex h-full items-center justify-center">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="text-foreground text-3xl font-bold tracking-tight">Let's get you started!</h1>
			<p class="text-muted-foreground mt-2">Choose the setup method that would suit you best</p>
		</div>

		<div class="space-y-6">
			<!-- Self Setup Option -->
			<Button
				href="/onboarding/self-setup"
				variant="outline"
				size="lg"
				class="hover:border-primary h-auto w-full border-2 p-6 whitespace-normal transition-colors"
			>
				<div class="space-y-2 text-center">
					<div class="text-lg font-semibold">Set up yourself</div>
					<p class="text-muted-foreground max-w-xs text-sm">
						Follow our guided setup process to configure everything on your own
					</p>
				</div>
			</Button>

			<!-- Dashed Line Separator -->
			<div class="relative">
				<Separator class="border-dashed" />
				<div class="absolute inset-0 flex items-center justify-center">
					<span class="bg-background text-muted-foreground px-2 text-xs">OR</span>
				</div>
			</div>

			<!-- Team Help Option -->
			<Button
				href="/onboarding/team-help"
				variant="default"
				size="lg"
				class="h-auto w-full p-6 whitespace-normal transition-colors"
			>
				<div class="space-y-2 text-center">
					<div class="text-lg font-semibold">Get help from the eddi team</div>
					<p class="max-w-xs text-sm opacity-90">
						Book a session with our team to walk through the whole process
					</p>
				</div>
			</Button>
		</div>
	</div>
</div>
