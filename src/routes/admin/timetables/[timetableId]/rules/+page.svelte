<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-3">
		<Checkbox id="constraintBasicCompulsoryTime" checked disabled />
		<Label for="constraintBasicCompulsoryTime">Basic Compulsory Time Constraint</Label>
	</div>

	<div class="flex items-center gap-3">
		<Checkbox id="constraintBasicCompulsorySpace" checked disabled />
		<Label for="constraintBasicCompulsorySpace">Basic Compulsory Space Constraint</Label>
	</div>
</div>
