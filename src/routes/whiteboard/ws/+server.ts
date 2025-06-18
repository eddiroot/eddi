import type { Socket } from '@sveltejs/kit';

let whiteboardObjects = {
	objects: [],
	background: ''
};

// Can ignore the warning on the next line
export const socket: Socket = {
	open(peer) {
		peer.send(JSON.stringify({ type: 'objects', objects: whiteboardObjects }));
		peer.subscribe('whiteboard');
	},

	message(peer, message) {
		const parsedMessage = JSON.parse(String(message));
		if (parsedMessage.type === 'objects') {
			whiteboardObjects = parsedMessage.objects;
			peer.publish('whiteboard', JSON.stringify({ type: 'objects', objects: whiteboardObjects }));
		}
	},

	close(peer) {
		peer.unsubscribe('whiteboard');
	}
};
