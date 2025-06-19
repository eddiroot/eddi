import type { Socket } from '@sveltejs/kit';

interface Whiteboard {
	objects: {
		id: string;
		// A bunch of other properties that we don't need to be concerned with
	}[];
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
		} else if (parsedMessage.type === 'add') {
			whiteboard.objects.push(parsedMessage.object);
			peer.publish('whiteboard', JSON.stringify({ type: 'add', object: parsedMessage.object }));
		} else if (parsedMessage.type === 'remove') {
			whiteboard.objects = whiteboard.objects.filter((obj) => obj.id !== parsedMessage.object.id);
			peer.publish('whiteboard', JSON.stringify({ type: 'remove', object: parsedMessage.object }));
		} else if (parsedMessage.type === 'update') {
			const index = whiteboard.objects.findIndex((obj) => obj.id === parsedMessage.object.id);
			if (index !== -1) {
				whiteboard.objects[index] = parsedMessage.object;
				peer.publish(
					'whiteboard',
					JSON.stringify({ type: 'update', object: parsedMessage.object })
				);
			}
		}
	},

	close(peer) {
		peer.unsubscribe('whiteboard');
	}
};
