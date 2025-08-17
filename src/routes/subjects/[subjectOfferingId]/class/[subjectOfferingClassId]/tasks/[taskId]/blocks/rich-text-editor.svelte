<script lang="ts">
	import Tiptap from '$lib/components/tiptap.svelte';
	import { ViewMode } from '../constants';

	let { initialContent = '', viewMode = ViewMode.VIEW, onUpdate } = $props();

	let content = $state<string>(initialContent);
</script>

<Tiptap {content} isEditable={viewMode == ViewMode.EDIT ? true : false} {onUpdate} />
