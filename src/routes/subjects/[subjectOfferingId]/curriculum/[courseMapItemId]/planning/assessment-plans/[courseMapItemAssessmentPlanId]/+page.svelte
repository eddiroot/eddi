<script lang="ts">
	import { page } from '$app/state';
	let { data } = $props();
</script>

<!-- Hero Section with Assessment Plan Image -->
<div class="relative h-64 w-full overflow-hidden mb-8">
	{#if data.assessmentPlan.imageBase64}
		<img 
			src={`data:image/png;base64,${data.assessmentPlan.imageBase64}`}
			alt={data.assessmentPlan.name}
			class="absolute inset-0 w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/40"></div>
	{:else if data.courseMapItem.imageBase64}
		<img 
			src={`data:image/png;base64,${data.courseMapItem.imageBase64}`}
			alt={data.courseMapItem.topic}
			class="absolute inset-0 w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/40"></div>
	{:else}
		<div class="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/10"></div>
	{/if}
	
	<!-- Assessment Plan Title Overlay (centered) -->
	<div class="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
		<h1 class="text-4xl font-bold mb-2">{data.assessmentPlan.name}</h1>
		<p class="text-lg opacity-90">Topic: {data.courseMapItem.topic}</p>
	</div>
</div>

<div class="max-w-4xl mx-auto px-6 space-y-12">
	<!-- Scopes Section -->
	{#if data.assessmentPlan.scope?.length}
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Assessment Scopes</h2>
			<ul class="list-disc ml-6 space-y-2 text-muted-foreground leading-relaxed">
				{#each data.assessmentPlan.scope as scope}
					<li>{scope}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Curriculum Standards Section -->
	{#if data.standards.length > 0}
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Curriculum Standards Assessed</h2>
			<ul class="list-disc ml-6 space-y-3">
				{#each data.standards as standard}
					<li>
						<div class="font-medium">{standard.name}:</div>
						{#if standard.description}
							<div class="text-muted-foreground mt-1">{standard.description}</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Description Section -->
	{#if data.assessmentPlan.description}
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Description</h2>
			<p class="text-muted-foreground leading-relaxed">{data.assessmentPlan.description}</p>
		</div>
	{/if}

	<!-- Rubric Section -->
	{#if data.rubric}
		<div class="space-y-6">
			<h2 class="text-2xl font-semibold">Assessment Rubric</h2>
			
			<div class="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg">
				<!-- Rubric Header -->
				<div class="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
					<h3 class="font-bold text-xl text-orange-900">{data.rubric.rubric.title}</h3>
					{#if data.rubric.rubric.description}
						<p class="text-sm text-orange-700 mt-2">{data.rubric.rubric.description}</p>
					{/if}
				</div>

				<!-- Rubric Table -->
				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr>
								<th class="px-4 py-4 text-left font-bold text-gray-900 border-2 border-gray-300 bg-gray-100 w-1/5">
									Rubric Criteria
								</th>
								<th class="px-4 py-4 text-center font-bold text-green-800 border-2 border-gray-300 bg-green-100 w-1/5">
									Exemplary<br>
									<span class="text-xs font-normal">4 points</span>
								</th>
								<th class="px-4 py-4 text-center font-bold text-blue-800 border-2 border-gray-300 bg-blue-100 w-1/5">
									Accomplished<br>
									<span class="text-xs font-normal">3 points</span>
								</th>
								<th class="px-4 py-4 text-center font-bold text-yellow-800 border-2 border-gray-300 bg-yellow-100 w-1/5">
									Developing<br>
									<span class="text-xs font-normal">2 points</span>
								</th>
								<th class="px-4 py-4 text-center font-bold text-red-800 border-2 border-gray-300 bg-red-100 w-1/5">
									Beginning<br>
									<span class="text-xs font-normal">1 point</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{#each data.rubric.rows as { row, cells }}
								<tr class="border-b-2 border-gray-200">
									<td class="px-4 py-4 font-bold text-gray-900 border-2 border-gray-300 bg-gray-50 align-top">
										{row.title}
									</td>
									{#each ['exemplary', 'accomplished', 'developing', 'beginning'] as level}
										{@const cell = cells.find(c => c.level === level)}
										<td class="px-4 py-4 border-2 border-gray-300 text-sm align-top {
											level === 'exemplary' ? 'bg-green-50' :
											level === 'accomplished' ? 'bg-blue-50' :
											level === 'developing' ? 'bg-yellow-50' :
											'bg-red-50'
										}">
											{#if cell}
												<div class="space-y-2">
													<p class="text-gray-800 leading-relaxed">{cell.description}</p>
													<div class="inline-block px-2 py-1 text-xs font-bold rounded {
														level === 'exemplary' ? 'bg-green-200 text-green-800' :
														level === 'accomplished' ? 'bg-blue-200 text-blue-800' :
														level === 'developing' ? 'bg-yellow-200 text-yellow-800' :
														'bg-red-200 text-red-800'
													}">
														{cell.marks} {cell.marks === 1 ? 'mark' : 'marks'}
													</div>
												</div>
											{:else}
												<div class="flex items-center justify-center h-20">
													<span class="text-gray-400 italic text-center">Not defined</span>
												</div>
											{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Rubric Footer -->
				<div class="p-4 bg-gray-50 border-t-2 border-gray-200">
					<p class="text-sm text-gray-600 text-center">
						<strong>Total Score:</strong> _____ / {data.rubric.rows.length * 4} points
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>


