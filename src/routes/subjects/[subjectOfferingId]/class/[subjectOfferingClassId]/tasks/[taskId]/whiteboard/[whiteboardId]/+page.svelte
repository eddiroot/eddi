<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as fabric from 'fabric';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import MousePointerIcon from '@lucide/svelte/icons/mouse-pointer';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import HandIcon from '@lucide/svelte/icons/hand';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import SquareIcon from '@lucide/svelte/icons/square';
	import TriangleIcon from '@lucide/svelte/icons/triangle';
	import TypeIcon from '@lucide/svelte/icons/type';
	import EraseIcon from '@lucide/svelte/icons/eraser';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	let { data } = $props();

	let socket = $state() as WebSocket;
	let canvas: fabric.Canvas;
	let selectedTool = $state('select');
	let whiteboardCanvas = $state<HTMLCanvasElement>();
	
	let isDragging = false;
	let lastPos = { x: 0, y: 0 };
	let currentMousePos = $state({ x: 0, y: 0 });
	let isPanning = false;
	let lastWheelTime = 0;
	let isPanMode = false;
	let panStartPos = { x: 0, y: 0 };

	const { whiteboardId, taskId, subjectOfferingId, subjectOfferingClassId } = $derived(page.params);
	const whiteboardIdNum = $derived(parseInt(whiteboardId));

	const sendCanvasUpdate = (data: Object) => {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ ...data, whiteboardId: whiteboardIdNum }));
		}
	};

	const setSelectTool = () => {
		selectedTool = 'select';
		if (!canvas) return;
		canvas.isDrawingMode = false;
		canvas.selection = true;
		canvas.defaultCursor = 'default';
		canvas.hoverCursor = 'move';
	};

	const setPanTool = () => {
		selectedTool = 'pan';
		if (!canvas) return;
		canvas.isDrawingMode = false;
		canvas.selection = false;
		canvas.discardActiveObject(); 
		canvas.defaultCursor = 'grab';
		canvas.hoverCursor = 'grab';
	};

	const setDrawTool = () => {
		selectedTool = 'draw';
		if (!canvas) return;
		canvas.isDrawingMode = true;
		canvas.selection = false;
		canvas.defaultCursor = 'crosshair';

		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.width = 2;
		canvas.freeDrawingBrush.color = '#000000';
	};

	const addShape = (shapeType: string) => {
		if (!canvas) return;

		setSelectTool();
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
		if (!canvas) return;

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
		if (!canvas) return;

		canvas.clear();
		sendCanvasUpdate({
			type: 'clear'
		});
	};

	const deleteSelected = () => {
		if (!canvas) return;

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

	const goBack = () => {
		// Navigate back to the task
		goto(`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}`);
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (!canvas) return;

		if (event.key === 'Backspace' || event.key === 'Delete') {
			const activeObject = canvas.getActiveObject();
			// @ts-expect-error
			if (activeObject && (!activeObject.isType('textbox') || !activeObject.isEditing)) {
				event.preventDefault();
				deleteSelected();
			}
		}
	};

	onMount(() => {
		if (!whiteboardCanvas) return;

		// Prevent body scrolling while on whiteboard
		document.body.style.overflow = 'hidden';

		canvas = new fabric.Canvas(whiteboardCanvas);
		canvas.setDimensions({ width: 1200, height: 800 });

		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.width = 2;
		canvas.freeDrawingBrush.color = '#000000';

		setSelectTool();

		// Connect to WebSocket for real-time collaboration
		socket = new WebSocket(`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}/whiteboard/ws`);

		socket.addEventListener('open', () => {
			// Send whiteboard ID after connection is established
			if (socket && socket.readyState === WebSocket.OPEN) {
				socket.send(
					JSON.stringify({
						type: 'init',
						whiteboardId: whiteboardIdNum
					})
				);
			}
		});

		socket.addEventListener('message', async (event) => {
			try {
				const messageData = JSON.parse(event.data);
				if (messageData.whiteboardId !== whiteboardIdNum) return; // Ignore messages for other whiteboards

				if (messageData.type === 'load') {
					if (messageData.whiteboard.objects.length > 0) {
						const objects = await fabric.util.enlivenObjects(messageData.whiteboard.objects);
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
				} else if (messageData.type === 'add') {
					const objects = await fabric.util.enlivenObjects([messageData.object]);
					if (objects.length > 0) {
						const obj = objects[0];
						canvas.add(obj as fabric.FabricObject);
						canvas.renderAll();
					}
				} else if (messageData.type === 'modify' || messageData.type === 'update') {
					const objects = canvas.getObjects();
					// @ts-expect-error
					const obj = objects.find((o) => o.id === messageData.object.id);
					if (obj) {
						obj.set(messageData.object);
						canvas.renderAll();
					}
				} else if (messageData.type === 'delete' || messageData.type === 'remove') {
					const objects = canvas.getObjects();
					const objectsToRemove = messageData.objects || [messageData.object];
					objectsToRemove.forEach((objData: any) => {
						// @ts-expect-error
						const obj = objects.find((o) => o.id === objData.id);
						if (obj) {
							canvas.remove(obj);
						}
					});
					canvas.renderAll();
				} else if (messageData.type === 'clear') {
					canvas.clear();
				}
			} catch (e) {
				console.error('Error parsing JSON:', e);
			}
		});

		// Canvas event listeners
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

		canvas.on('mouse:wheel', (opt) => {
			const delta = opt.e.deltaY;
			
			let zoom = canvas.getZoom();
			zoom *= 0.990 ** delta;
			if (zoom > 20) zoom = 20;
			if (zoom < 0.1) zoom = 0.1;
			
			const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
			canvas.zoomToPoint(point, zoom);
			opt.e.preventDefault();
			opt.e.stopPropagation();
		});

		canvas.on('mouse:down', (opt) => {
			const evt = opt.e;
			
			if (selectedTool === 'pan') {
				isPanMode = true;
				canvas.selection = false;
				canvas.discardActiveObject();
				canvas.setCursor('grabbing');
				
				const clientX = 'clientX' in evt ? evt.clientX : evt.touches?.[0]?.clientX || 0;
				const clientY = 'clientY' in evt ? evt.clientY : evt.touches?.[0]?.clientY || 0;
				panStartPos = { x: clientX, y: clientY };
				
				opt.e.preventDefault();
				opt.e.stopPropagation();
			} else if (selectedTool === 'select') {
				// Select tool - only pan if clicking on empty space
				if (!canvas.getActiveObject() && !canvas.findTarget(evt)) {
					isPanMode = true;
					canvas.selection = false;
					canvas.setCursor('grab');
					
					const clientX = 'clientX' in evt ? evt.clientX : evt.touches?.[0]?.clientX || 0;
					const clientY = 'clientY' in evt ? evt.clientY : evt.touches?.[0]?.clientY || 0;
					panStartPos = { x: clientX, y: clientY };
					
					opt.e.preventDefault();
				}
			}
		});

		canvas.on('mouse:move', (opt) => {
			// Update current mouse position for real-time tracking
			const pointer = canvas.getScenePoint(opt.e);
			currentMousePos = { x: pointer.x, y: pointer.y };
			
			if (isPanMode) {
				const e = opt.e;
				// Handle both mouse and touch events
				const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX || 0;
				const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY || 0;
				
				const deltaX = clientX - panStartPos.x;
				const deltaY = clientY - panStartPos.y;
				
				canvas.relativePan(new fabric.Point(deltaX, deltaY));
				panStartPos = { x: clientX, y: clientY };
				
				canvas.setCursor('grabbing');
			}
		});

		canvas.on('mouse:up', (opt) => {
			if (isPanMode) {
				isPanMode = false;
				canvas.selection = selectedTool === 'select';
				
				// Set cursor based on current tool
				if (selectedTool === 'pan') {
					canvas.setCursor('grab');
				} else if (selectedTool === 'select') {
					canvas.setCursor('default');
				} else if (selectedTool === 'draw') {
					canvas.setCursor('crosshair');
				}
			}
		});

		window.addEventListener('keydown', handleKeyDown);

		// Add pinch-to-zoom for touch devices
		let initialPinchDistance = 0;
		let initialZoom = 1;
		
		whiteboardCanvas.addEventListener('touchstart', (e) => {
			if (e.touches.length === 2) {
				// Two finger touch - setup for pinch zoom
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				
				const dx = touch1.clientX - touch2.clientX;
				const dy = touch1.clientY - touch2.clientY;
				initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
				initialZoom = canvas.getZoom();
				
				e.preventDefault();
			}
		});

		whiteboardCanvas.addEventListener('touchmove', (e) => {
			if (e.touches.length === 2 && initialPinchDistance > 0) {
				// Two finger move - pinch to zoom
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				
				const dx = touch1.clientX - touch2.clientX;
				const dy = touch1.clientY - touch2.clientY;
				const currentDistance = Math.sqrt(dx * dx + dy * dy);
				
				const scale = currentDistance / initialPinchDistance;
				const newZoom = initialZoom * scale;
				const constrainedZoom = Math.max(0.1, Math.min(20, newZoom));
				
				// Zoom at center of pinch gesture
				const centerX = (touch1.clientX + touch2.clientX) / 2;
				const centerY = (touch1.clientY + touch2.clientY) / 2;
				
				if (whiteboardCanvas) {
					const rect = whiteboardCanvas.getBoundingClientRect();
					const point = new fabric.Point(centerX - rect.left, centerY - rect.top);
					canvas.zoomToPoint(point, constrainedZoom);
				}
				
				e.preventDefault();
			}
		});

		whiteboardCanvas.addEventListener('touchend', (e) => {
			if (e.touches.length < 2) {
				initialPinchDistance = 0;
			}
		});

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	onDestroy(() => {
		// Restore body scrolling when leaving whiteboard
		document.body.style.overflow = '';
		
		if (socket) {
			socket.close();
		}
		if (canvas) {
			canvas.dispose();
		}
	});
</script>

<div class="bg-background flex h-screen flex-col">
	<!-- Header with back button and title -->
	<header
		class="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur"
	>
		<div class="flex h-14 items-center px-4">
			<Button variant="ghost" size="sm" onclick={goBack} class="mr-4">
				<ArrowLeftIcon class="mr-2 h-4 w-4" />
				Back to Task
			</Button>
			<div class="flex-1">
				<h1 class="text-lg font-semibold">
					{data.whiteboard.title || 'Interactive Whiteboard'}
				</h1>
				<p class="text-muted-foreground text-sm">
					{data.task.title}
				</p>
			</div>
		</div>
	</header>

	<!-- Toolbar -->
	<div class="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
		<div class="flex justify-center py-3">
			<div class="bg-background flex items-center gap-1 rounded-md border px-4 py-2 shadow-sm">
				<!-- Selection Tool -->
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant={selectedTool === 'select' ? 'default' : 'ghost'}
							size="icon"
							onclick={setSelectTool}
							class="h-9 w-9"
						>
							<MousePointerIcon class="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Select</Tooltip.Content>
				</Tooltip.Root>

				<!-- Pan Tool -->
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant={selectedTool === 'pan' ? 'default' : 'ghost'}
							size="icon"
							onclick={setPanTool}
							class="h-9 w-9"
						>
							<HandIcon class="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Pan</Tooltip.Content>
				</Tooltip.Root>

				<div class="bg-border mx-1 h-6 w-px"></div>

				<!-- Draw Tool -->
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant={selectedTool === 'draw' ? 'default' : 'ghost'}
							size="icon"
							onclick={setDrawTool}
							class="h-9 w-9"
						>
							<PenToolIcon class="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Draw</Tooltip.Content>
				</Tooltip.Root>

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
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="ghost" size="icon" onclick={addText} class="h-9 w-9">
							<TypeIcon class="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Add Text</Tooltip.Content>
				</Tooltip.Root>

				<div class="bg-border mx-1 h-6 w-px"></div>

				<!-- Delete Selected -->
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="ghost" size="icon" onclick={deleteSelected} class="h-9 w-9">
							<TrashIcon class="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Delete Selected</Tooltip.Content>
				</Tooltip.Root>

				<!-- Clear Canvas -->
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="ghost" size="icon" onclick={clearCanvas} class="h-9 w-9">
							<EraseIcon class="h-4 w-4" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Clear All</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</div>
	</div>

	<!-- Whiteboard Canvas -->
	<main class="flex flex-1 items-center justify-center overflow-hidden p-4">
		<div class="rounded-lg border-2 bg-white shadow-lg dark:bg-neutral-700">
			<canvas bind:this={whiteboardCanvas}></canvas>
		</div>
	</main>
</div>
