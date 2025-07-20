<script lang="ts">
	let periodsExample = $state([{ startTime: '8:40am', endTime: '9:30am' }]);

	let startTime = $state('9:35am');
	let endTime = $state('10:25am');
</script>

<form>
	<ol class="grid grid-cols-7">
		{#each periodsExample as period}
			<li>{period.startTime} - {period.endTime}</li>
		{/each}
	</ol>
	<div>
		<input bind:value={startTime} />
		<input bind:value={endTime} />
		<button onclick={() => (periodsExample = [...periodsExample, { startTime, endTime }])}
			>Add Period</button
		>
	</div>
</form>
