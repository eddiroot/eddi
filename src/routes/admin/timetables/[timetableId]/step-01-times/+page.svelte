<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let periodsExample = $state([
		{ startTime: '8:40am', endTime: '9:30am' },
		{ startTime: '9:35am', endTime: '10:25am' },
		{ startTime: '10:30am', endTime: '11:20am' },
		{ startTime: '11:25am', endTime: '12:15pm' },
		{ startTime: '12:20pm', endTime: '1:10pm' },
		{ startTime: '1:15pm', endTime: '2:05pm' },
		{ startTime: '2:10pm', endTime: '3:00pm' }
	]);
</script>

<div class="space-y-8">
	<form method="POST" action="?/updateDays" class="space-y-4">
		<h2 class="text-2xl leading-tight font-bold">Days</h2>
		<ol class="grid grid-cols-7 gap-2">
			<li>
				<input
					type="checkbox"
					id="monday"
					value="monday"
					class="peer hidden"
					defaultChecked
					required={false}
				/>
				<label
					for="monday"
					class="border-border peer-checked:border-primary peer-checked:bg-primary/10 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border-2 p-5"
				>
					<span class="text-xl font-bold">Monday</span>
				</label>
			</li>
			<li>
				<input
					type="checkbox"
					id="tuesday"
					value="tuesday"
					class="peer hidden"
					defaultChecked
					required={false}
				/>
				<label
					for="tuesday"
					class="border-border peer-checked:border-primary peer-checked:bg-primary/10 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border-2 p-5"
				>
					<span class="text-xl font-bold">Tuesday</span>
				</label>
			</li>
			<li>
				<input
					type="checkbox"
					id="wednesday"
					value="wednesday"
					class="peer hidden"
					defaultChecked
					required={false}
				/>
				<label
					for="wednesday"
					class="border-border peer-checked:border-primary peer-checked:bg-primary/10 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border-2 p-5"
				>
					<span class="text-xl font-bold">Wednesday</span>
				</label>
			</li>
			<li>
				<input
					type="checkbox"
					id="thursday"
					value="thursday"
					class="peer hidden"
					defaultChecked
					required={false}
				/>
				<label
					for="thursday"
					class="border-border peer-checked:border-primary peer-checked:bg-primary/10 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border-2 p-5"
				>
					<span class="text-xl font-bold">Thursday</span>
				</label>
			</li>
			<li>
				<input
					type="checkbox"
					id="friday"
					value="friday"
					class="peer hidden"
					defaultChecked
					required={false}
				/>
				<label
					for="friday"
					class="border-border peer-checked:border-primary peer-checked:bg-primary/10 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border-2 p-5"
				>
					<span class="text-xl font-bold">Friday</span>
				</label>
			</li>
			<li>
				<input
					type="checkbox"
					id="saturday"
					value="saturday"
					class="peer hidden"
					required={false}
				/>
				<label
					for="saturday"
					class="border-border peer-checked:border-primary peer-checked:bg-primary/10 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border-2 p-5"
				>
					<span class="text-xl font-bold">Saturday</span>
				</label>
			</li>
			<li>
				<input type="checkbox" id="sunday" value="sunday" class="peer hidden" required={false} />
				<label
					for="sunday"
					class="border-border peer-checked:border-primary peer-checked:bg-primary/10 inline-flex w-full cursor-pointer items-center justify-center rounded-lg border-2 p-5"
				>
					<span class="text-xl font-bold">Sunday</span>
				</label>
			</li>
		</ol>
	</form>

	<div class="space-y-4">
		<h2 class="text-2xl leading-tight font-bold">Periods</h2>
		<form method="POST" action="?/updatePeriods" class="flex flex-row gap-2">
			<Input name="startTime" type="time" class="w-32" />
			<Input name="endTime" type="time" class="w-32" />
			<Button type="submit"><PlusIcon />Add</Button>
		</form>
		<ol class="space-y-2">
			{#each periodsExample as period}
				<li
					class="border-border bg-card hover:border-primary hover:bg-primary/5 flex min-h-10 w-full items-center justify-center rounded-lg border-2 px-4 py-3 transition-colors"
				>
					<span class="font-semibold">{period.startTime} - {period.endTime}</span>
				</li>
			{/each}
		</ol>
	</div>
</div>
