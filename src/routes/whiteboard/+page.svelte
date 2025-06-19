<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { onMount } from 'svelte';
	import * as fabric from 'fabric';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import MousePointerIcon from '@lucide/svelte/icons/mouse-pointer';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import SquareIcon from '@lucide/svelte/icons/square';
	import TriangleIcon from '@lucide/svelte/icons/triangle';
	import TypeIcon from '@lucide/svelte/icons/type';
	import EraseIcon from '@lucide/svelte/icons/eraser';
	import TrashIcon from '@lucide/svelte/icons/trash';

	let socket = $state() as WebSocket;
	let canvas: fabric.Canvas;
	let selectedTool = $state('select');

	const sendCanvasUpdate = (data: Object) => {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(data));
		}
	};

	const setSelectTool = () => {
		selectedTool = 'select';
		canvas.isDrawingMode = false;
		canvas.selection = true;
		canvas.defaultCursor = 'default';
		canvas.hoverCursor = 'move';
	};

	const setDrawTool = () => {
		selectedTool = 'draw';
		canvas.isDrawingMode = true;
		canvas.selection = false;
		canvas.defaultCursor = 'crosshair';

		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.width = 2;
		canvas.freeDrawingBrush.color = '#000000';
	};

	const addShape = (shapeType: string) => {
		let shape: fabric.Object;
		const centerX = canvas.width! / 2;
		const centerY = canvas.height! / 2;

		switch (shapeType) {
			case 'circle':
				shape = new fabric.Circle({
					id: uuidv4(),
					radius: 50,
					fill: 'transparent',
					stroke: '#000000',
					strokeWidth: 2,
					left: centerX - 50,
					top: centerY - 50
				});
				break;
			case 'rectangle':
				shape = new fabric.Rect({
					id: uuidv4(),
					width: 100,
					height: 60,
					fill: 'transparent',
					stroke: '#000000',
					strokeWidth: 2,
					left: centerX - 50,
					top: centerY - 30
				});
				break;
			case 'triangle':
				shape = new fabric.Triangle({
					id: uuidv4(),
					width: 80,
					height: 80,
					fill: 'transparent',
					stroke: '#000000',
					strokeWidth: 2,
					left: centerX - 40,
					top: centerY - 40
				});
				break;
			default:
				return;
		}

		canvas.add(shape);
		canvas.setActiveObject(shape);
		canvas.renderAll();
		const objData = shape.toObject();
		// @ts-expect-error
		objData.id = shape.id;
		sendCanvasUpdate({
			type: 'add',
			object: objData
		});
	};

	const addText = () => {
		const text = new fabric.Textbox('Click to edit text', {
			id: uuidv4(),
			left: canvas.width! / 2 - 75,
			top: canvas.height! / 2 - 10,
			width: 150,
			fontSize: 16,
			fontFamily: 'Arial',
			fill: '#000000'
		});
		canvas.add(text);
		canvas.setActiveObject(text);
		canvas.renderAll();
		const objData = text.toObject();
		// @ts-expect-error
		objData.id = text.id;
		sendCanvasUpdate({
			type: 'add',
			object: objData
		});
	};

	const clearCanvas = () => {
		canvas.clear();
		sendCanvasUpdate({
			type: 'clear'
		});
	};

	const deleteSelected = () => {
		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length) {
			activeObjects.forEach((obj) => canvas.remove(obj));
			canvas.discardActiveObject();
			canvas.renderAll();
			const objectsData = activeObjects.map((obj) => {
				const objData = obj.toObject();
				// @ts-expect-error
				objData.id = obj.id;
				return objData;
			});
			sendCanvasUpdate({
				type: 'delete',
				objects: objectsData
			});
		}
	};

	onMount(() => {
		socket = new WebSocket('/whiteboard/ws');
		canvas = new fabric.Canvas('whiteboard');

		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.width = 2;
		canvas.freeDrawingBrush.color = '#000000';

		setSelectTool();

		socket.addEventListener('message', async (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === 'load') {
					// Use util.enlivenObjects for proper object deserialization
					if (data.whiteboard.objects.length > 0) {
						const objects = await fabric.util.enlivenObjects(data.whiteboard.objects);
						canvas.clear();
						objects.forEach((obj: any) => {
							if (obj && typeof obj.addTo === 'function') {
								obj.addTo(canvas);
							} else {
								canvas.add(obj);
							}
						});
						canvas.renderAll();
					}
				} else if (data.type === 'add') {
					const objects = await fabric.util.enlivenObjects([data.object]);
					if (objects.length > 0) {
						const obj = objects[0];
						canvas.add(obj as fabric.FabricObject);
						canvas.renderAll();
					}
				} else if (data.type === 'modify' || data.type === 'update') {
					const objects = canvas.getObjects();
					// We already add an ID to each object in the canvas, so we can find it later
					// @ts-expect-error
					const obj = objects.find((o) => o.id === data.object.id);
					if (obj) {
						obj.set(data.object);
						canvas.renderAll();
					}
				} else if (data.type === 'delete' || data.type === 'remove') {
					const objects = canvas.getObjects();
					const objectsToRemove = data.objects || [data.object];
					objectsToRemove.forEach((objData: any) => {
						// We already add an ID to each object in the canvas, so we can find it later
						// @ts-expect-error
						const obj = objects.find((o) => o.id === objData.id);
						if (obj) {
							canvas.remove(obj);
						}
					});
					canvas.renderAll();
				} else if (data.type === 'clear') {
					canvas.clear();
				}
			} catch (e) {
				console.error('Error parsing JSON:', e);
			}
		});

		canvas.on('object:moving', ({ target }) => {
			const objData = target.toObject();
			// @ts-expect-error
			objData.id = target.id;
			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		});

		canvas.on('object:scaling', ({ target }) => {
			const objData = target.toObject();
			// @ts-expect-error
			objData.id = target.id;
			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		});

		canvas.on('object:rotating', ({ target }) => {
			const objData = target.toObject();
			// @ts-expect-error
			objData.id = target.id;
			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		});

		canvas.on('path:created', ({ path }) => {
			// Add ID to the path object
			// @ts-expect-error
			path.id = uuidv4();
			const objData = path.toObject();
			// @ts-expect-error
			objData.id = path.id;
			sendCanvasUpdate({
				type: 'add',
				object: objData
			});
		});

		canvas.on('text:changed', ({ target }) => {
			const objData = target.toObject();
			// @ts-expect-error
			objData.id = target.id;
			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		});

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Backspace' || event.key === 'Delete') {
				const activeObject = canvas.getActiveObject();
				// @ts-expect-error
				if (activeObject && (!activeObject.isType('textbox') || !activeObject.isEditing)) {
					event.preventDefault();
					deleteSelected();
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

<!-- Floating Menubar -->
<div class="fixed top-16 left-1/2 z-50 -translate-x-1/2 transform">
	<div
		class="bg-background/95 supports-[backdrop-filter]:bg-background/60 rounded-lg border p-2 shadow-lg backdrop-blur"
	>
		<div class="flex items-center gap-1">
			<!-- Selection Tool -->
			<Button
				variant={selectedTool === 'select' ? 'default' : 'ghost'}
				size="icon"
				onclick={setSelectTool}
				class="h-9 w-9"
			>
				<MousePointerIcon class="h-4 w-4" />
			</Button>

			<!-- Draw Tool -->
			<Button
				variant={selectedTool === 'draw' ? 'default' : 'ghost'}
				size="icon"
				onclick={setDrawTool}
				class="h-9 w-9"
			>
				<PenToolIcon class="h-4 w-4" />
			</Button>

			<div class="bg-border mx-1 h-6 w-px"></div>

			<!-- Shapes Dropdown -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="icon" class="h-9 w-9">
							<SquareIcon class="h-4 w-4" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Item onclick={() => addShape('rectangle')}>
						<SquareIcon class="h-4 w-4" />
						Rectangle
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addShape('circle')}>
						<CircleIcon class="h-4 w-4" />
						Circle
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => addShape('triangle')}>
						<TriangleIcon class="h-4 w-4" />
						Triangle
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Text Tool -->
			<Button variant="ghost" size="icon" onclick={addText} class="h-9 w-9">
				<TypeIcon class="h-4 w-4" />
			</Button>

			<div class="bg-border mx-1 h-6 w-px"></div>

			<!-- Delete Selected -->
			<Button variant="ghost" size="icon" onclick={deleteSelected} class="h-9 w-9">
				<TrashIcon class="h-4 w-4" />
			</Button>

			<!-- Clear Canvas -->
			<Button variant="ghost" size="icon" onclick={clearCanvas} class="h-9 w-9">
				<EraseIcon class="h-4 w-4" />
			</Button>
		</div>
	</div>
</div>
<div class="flex h-full items-center justify-center">
	<canvas id="whiteboard" width={1200} height={800} class="border"></canvas>
</div>
