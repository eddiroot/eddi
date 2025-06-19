import type { Socket } from './$types.js';

interface WhiteboardObject {
	id: string;
	// A bunch of other properties that we don't need to be concerned with
	[key: string]: unknown;
}

interface Whiteboard {
	objects: WhiteboardObject[];
}

const whiteboard: Whiteboard = {
	objects: []
};

// Can ignore the warning on the next line
export const socket: Socket = {
	open(peer) {
		peer.send(JSON.stringify({ type: 'load', whiteboard: whiteboard }));
		peer.subscribe('whiteboard');
	},

	message(peer, message) {
		const parsedMessage = JSON.parse(String(message));
		if (parsedMessage.type === 'clear') {
			whiteboard.objects = [];
			peer.publish('whiteboard', JSON.stringify({ type: 'clear' }));
		} else if (parsedMessage.type === 'add' || parsedMessage.type === 'create') {
			whiteboard.objects.push(parsedMessage.object);
			peer.publish('whiteboard', JSON.stringify({ type: 'add', object: parsedMessage.object }));
		} else if (parsedMessage.type === 'remove' || parsedMessage.type === 'delete') {
			if (parsedMessage.objects) {
				parsedMessage.objects.forEach((objToRemove: WhiteboardObject) => {
					whiteboard.objects = whiteboard.objects.filter((obj) => obj.id !== objToRemove.id);
				});
				peer.publish(
					'whiteboard',
					JSON.stringify({ type: 'delete', objects: parsedMessage.objects })
				);
			} else if (parsedMessage.object) {
				whiteboard.objects = whiteboard.objects.filter((obj) => obj.id !== parsedMessage.object.id);
				peer.publish(
					'whiteboard',
					JSON.stringify({ type: 'delete', objects: [parsedMessage.object] })
				);
			}
		} else if (parsedMessage.type === 'update' || parsedMessage.type === 'modify') {
			const index = whiteboard.objects.findIndex((obj) => obj.id === parsedMessage.object.id);
			if (index !== -1) {
				whiteboard.objects[index] = parsedMessage.object;
				peer.publish(
					'whiteboard',
					JSON.stringify({ type: 'modify', object: parsedMessage.object })
				);
			}
		}
	},

	close(peer) {
		peer.unsubscribe('whiteboard');
	}
};
