import { Slice } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';

export function serializeForClipboard(view: EditorView, slice: Slice) {
	// Newer Tiptap/ProseMirror
	if (view && typeof view.serializeForClipboard === 'function') {
		return view.serializeForClipboard(slice);
	}

	throw new Error('No supported clipboard serialization method found.');
}
