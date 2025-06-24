import type { Socket } from './$types.js';
import {
	getWhiteboardObjects,
	saveWhiteboardObject,
	updateWhiteboardObject,
	deleteWhiteboardObject,
	deleteWhiteboardObjects,
	clearWhiteboard
} from '$lib/server/db/service.js';

export const socket: Socket = {
	async open(peer) {
		try {
			const objects = await getWhiteboardObjects(1);
			const whiteboardObjects = objects.map((obj) => ({
				id: obj.objectId,
				...(obj.objectData as Record<string, unknown>)
			}));

			peer.send(
				JSON.stringify({
					type: 'load',
					whiteboard: { objects: whiteboardObjects }
				})
			);
		} catch (error) {
			console.error('Failed to load whiteboard from database:', error);
			peer.send(
				JSON.stringify({
					type: 'load',
					whiteboard: { objects: [] }
				})
			);
		}
		peer.subscribe('whiteboard');
	},

	async message(peer, message) {
		const parsedMessage = JSON.parse(String(message));

		try {
			if (parsedMessage.type === 'clear') {
				await clearWhiteboard(1);
				peer.publish('whiteboard', JSON.stringify({ type: 'clear' }));
			} else if (parsedMessage.type === 'add' || parsedMessage.type === 'create') {
				const newObject = parsedMessage.object;

				await saveWhiteboardObject({
					objectId: newObject.id,
					objectType: newObject.type || 'unknown',
					objectData: newObject,
					whiteboardId: 1
				});

				peer.publish('whiteboard', JSON.stringify({ type: 'add', object: newObject }));
			} else if (parsedMessage.type === 'remove' || parsedMessage.type === 'delete') {
				if (parsedMessage.objects) {
					const objectsToRemove = parsedMessage.objects;
					const objectIds = objectsToRemove.map((obj: { id: string }) => obj.id);

					await deleteWhiteboardObjects(objectIds, 1);

					peer.publish('whiteboard', JSON.stringify({ type: 'delete', objects: objectsToRemove }));
				} else if (parsedMessage.object) {
					const objectToRemove = parsedMessage.object;

					await deleteWhiteboardObject(objectToRemove.id, 1);

					peer.publish('whiteboard', JSON.stringify({ type: 'delete', objects: [objectToRemove] }));
				}
			} else if (parsedMessage.type === 'update' || parsedMessage.type === 'modify') {
				const updatedObject = parsedMessage.object;

				await updateWhiteboardObject(updatedObject.id, updatedObject, 1);

				peer.publish('whiteboard', JSON.stringify({ type: 'modify', object: updatedObject }));
			}
		} catch (error) {
			console.error('Database operation failed:', error);
			peer.send(JSON.stringify({ type: 'error', message: 'Failed to persist changes' }));
		}
	},

	close(peer) {
		peer.unsubscribe('whiteboard');
	}
};
