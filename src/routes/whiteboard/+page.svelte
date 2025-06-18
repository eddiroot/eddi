<script lang="ts">
	import { onMount } from 'svelte';
	import * as fabric from 'fabric';

	let socket = $state() as WebSocket;

	onMount(() => {
		socket = new WebSocket('/whiteboard/ws');
		let canvas = new fabric.Canvas('whiteboard');

		window.addEventListener('resize', resizeCanvas);

		function resizeCanvas() {
			canvas.setDimensions({
				width: window.innerWidth,
				height: window.innerHeight
			});
		}

		resizeCanvas();

		socket.addEventListener('message', (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === 'objects') {
					const objects = data.objects;
					canvas.loadFromJSON(objects, () => {
						canvas.renderAll();
						resizeCanvas();
					});
				}
			} catch (e) {
				console.error('Error parsing JSON:', e);
			}
		});

		canvas.on('object:moving', () => {
			socket.send(
				JSON.stringify({
					type: 'objects',
					objects: canvas.toJSON()
				})
			);
		});
	});
</script>

<canvas id="whiteboard"></canvas>
