import type { Socket } from '@sveltejs/kit';

let whiteboardObjects = {
	objects: [
		{
			type: 'rect',
			originX: 'center',
			originY: 'center',
			left: 300,
			top: 150,
			width: 150,
			height: 150,
			fill: '#29477F',
			overlayFill: null,
			stroke: null,
			strokeWidth: 1,
			strokeDashArray: null,
			strokeLineCap: 'butt',
			strokeLineJoin: 'miter',
			strokeMiterLimit: 10,
			scaleX: 1,
			scaleY: 1,
			angle: 0,
			flipX: false,
			flipY: false,
			opacity: 1,
			shadow: {
				color: 'rgba(94, 128, 191, 0.5)',
				blur: 5,
				offsetX: 10,
				offsetY: 10
			},
			visible: true,
			clipTo: null,
			rx: 0,
			ry: 0,
			x: 0,
			y: 0
		},
		{
			type: 'circle',
			originX: 'center',
			originY: 'center',
			left: 300,
			top: 400,
			width: 200,
			height: 200,
			fill: 'rgb(166,111,213)',
			overlayFill: null,
			stroke: null,
			strokeWidth: 1,
			strokeDashArray: null,
			strokeLineCap: 'butt',
			strokeLineJoin: 'miter',
			strokeMiterLimit: 10,
			scaleX: 1,
			scaleY: 1,
			angle: 0,
			flipX: false,
			flipY: false,
			opacity: 1,
			shadow: {
				color: '#5b238A',
				blur: 20,
				offsetX: -20,
				offsetY: -10
			},
			visible: true,
			clipTo: null,
			radius: 100
		}
	],
	background: ''
};

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
