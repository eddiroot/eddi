<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import WhiteboardFloatingMenu from '$lib/components/whiteboard-floating-menu.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import EraseIcon from '@lucide/svelte/icons/eraser';
	import HandIcon from '@lucide/svelte/icons/hand';
	import HomeIcon from '@lucide/svelte/icons/home';
	import ImageIcon from '@lucide/svelte/icons/image';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import MousePointerIcon from '@lucide/svelte/icons/mouse-pointer';
	import PenToolIcon from '@lucide/svelte/icons/pen-tool';
	import SquareIcon from '@lucide/svelte/icons/square';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import TriangleIcon from '@lucide/svelte/icons/triangle';
	import TypeIcon from '@lucide/svelte/icons/type';
	import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
	import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
	import * as fabric from 'fabric';
	import { onDestroy, onMount } from 'svelte';
	import { v4 as uuidv4 } from 'uuid';

	let { data } = $props();

	let socket = $state() as WebSocket;
	let canvas: fabric.Canvas;
	let selectedTool = $state('select');
	let whiteboardCanvas = $state<HTMLCanvasElement>();
	let isPanMode = false;
	let panStartPos = { x: 0, y: 0 };
	let currentZoom = $state(1);
	let showFloatingMenu = $state(false);
	let imageInput = $state<HTMLInputElement>();
	let isDrawingLine = $state(false);
	let isDrawingArrow = $state(false);
	let isDrawingShape = $state(false);
	let currentShapeType = $state<string>('');
	let isErasing = $state(false);
	let eraserTrail = $state<fabric.Object[]>([]);
	let lastEraserPoint = $state<{ x: number; y: number } | null>(null);
	let hoveredObjectsForDeletion = $state<fabric.Object[]>([]);
	let originalOpacities = $state<Map<fabric.Object, number>>(new Map());
	let startPoint = $state({ x: 0, y: 0 });
	let tempLine: fabric.Line | null = null;
	let tempShape: fabric.Object | null = null;

	const { whiteboardId, taskId, subjectOfferingId, subjectOfferingClassId } = $derived(page.params);
	const whiteboardIdNum = $derived(parseInt(whiteboardId ?? '0'));

	// Throttling mechanism for image updates only
	let imageUpdateQueue = new Map<string, any>();
	let imageThrottleTimeout: ReturnType<typeof setTimeout> | null = null;
	let isMovingImage = false;

	const sendCanvasUpdate = (data: Object) => {
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ ...data, whiteboardId: whiteboardIdNum }));
		}
	};

	// Throttled update function specifically for image movements
	const sendImageUpdate = (objectId: string, objectData: any, immediate = false) => {
		// Store the latest state for this image
		imageUpdateQueue.set(objectId, objectData);

		if (immediate) {
			// Send immediately for final positions (persist to database)
			sendCanvasUpdate({
				type: 'modify',
				object: objectData,
				live: false
			});
			imageUpdateQueue.delete(objectId);
			return;
		}

		// Throttle live image updates to reduce network traffic
		if (imageThrottleTimeout !== null) {
			clearTimeout(imageThrottleTimeout);
		}

		imageThrottleTimeout = setTimeout(() => {
			// Send all queued image updates as live updates (no database persistence)
			imageUpdateQueue.forEach((objData, objId) => {
				// For live image updates, send only essential positioning data
				const updateData = {
					id: objData.id,
					type: objData.type,
					left: objData.left,
					top: objData.top,
					scaleX: objData.scaleX,
					scaleY: objData.scaleY,
					angle: objData.angle,
					opacity: objData.opacity
				};

				sendCanvasUpdate({
					type: 'modify',
					object: updateData,
					live: true
				});
			});
			imageUpdateQueue.clear();
			imageThrottleTimeout = null;
		}, 100); // 100ms throttle for images
	};
	const setSelectTool = () => {
		selectedTool = 'select';
		showFloatingMenu = false;
		clearEraserState();
		clearShapeDrawingState();
		if (!canvas) return;
		canvas.isDrawingMode = false;
		canvas.selection = true;
		canvas.defaultCursor = 'default';
		canvas.hoverCursor = 'move';
	};

	const setPanTool = () => {
		selectedTool = 'pan';
		showFloatingMenu = false;
		clearEraserState();
		clearShapeDrawingState();
		if (!canvas) return;
		canvas.isDrawingMode = false;
		canvas.selection = false;
		canvas.discardActiveObject();
		canvas.defaultCursor = 'grab';
		canvas.hoverCursor = 'grab';
	};

	const setDrawTool = () => {
		selectedTool = 'draw';
		showFloatingMenu = true;
		clearEraserState();
		clearShapeDrawingState();
		if (!canvas) return;
		canvas.isDrawingMode = true;
		canvas.selection = false;
		canvas.defaultCursor = 'crosshair';

		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.width = 2;
		canvas.freeDrawingBrush.color = '#000000';
	};

	const setEraserTool = () => {
		selectedTool = 'eraser';
		showFloatingMenu = true;
		clearShapeDrawingState();
		if (!canvas) return;
		canvas.isDrawingMode = false;
		canvas.selection = false;
		canvas.defaultCursor = 'crosshair';

		// Clear any existing eraser state
		clearEraserState();
	};

	const clearEraserState = () => {
		// Remove eraser trail
		eraserTrail.forEach((trail) => canvas?.remove(trail));
		eraserTrail = [];
		lastEraserPoint = null;

		// Restore original opacities of hovered objects
		hoveredObjectsForDeletion.forEach((obj) => {
			const originalOpacity = originalOpacities.get(obj);
			if (originalOpacity !== undefined) {
				obj.set({ opacity: originalOpacity });
			}
		});
		hoveredObjectsForDeletion = [];
		originalOpacities.clear();

		canvas?.renderAll();
	};

	const clearShapeDrawingState = () => {
		if (tempShape) {
			canvas?.remove(tempShape);
			tempShape = null;
		}
		isDrawingShape = false;
		currentShapeType = '';
	};

	const addShape = (shapeType: string) => {
		if (!canvas) return;

		// Set up interactive shape drawing mode
		selectedTool = 'shapes';
		currentShapeType = shapeType;
		showFloatingMenu = true;
		clearEraserState();

		canvas.isDrawingMode = false;
		canvas.selection = false;
		canvas.defaultCursor = 'crosshair';
		canvas.hoverCursor = 'crosshair';
	};

	const addText = () => {
		if (!canvas) return;

		selectedTool = 'text';
		showFloatingMenu = true;

		const text = new fabric.Textbox('Click to edit text', {
			id: uuidv4(),
			left: canvas.width! / 2 - 75,
			top: canvas.height! / 2 - 10,
			width: 150,
			fontSize: 16,
			fontFamily: 'Arial',
			fill: '#000000',
			opacity: 1
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

	const addImage = () => {
		if (!imageInput) return;
		imageInput.click();
	};

	const handleImageUpload = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file || !canvas) return;

		// Check if file is an image
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file.');
			return;
		}

		// Create a FileReader to read the image
		const reader = new FileReader();
		reader.onload = (e) => {
			const imgSrc = e.target?.result as string;

			// Create fabric image from the uploaded file
			fabric.FabricImage.fromURL(imgSrc)
				.then((img) => {
					// @ts-expect-error
					img.id = uuidv4();

					// Scale image to reasonable size
					const maxWidth = 300;
					const maxHeight = 300;
					const scaleX = img.width! > maxWidth ? maxWidth / img.width! : 1;
					const scaleY = img.height! > maxHeight ? maxHeight / img.height! : 1;
					const scale = Math.min(scaleX, scaleY);

					img.scale(scale);

					// Center the image
					img.set({
						left: canvas.width! / 2 - (img.width! * scale) / 2,
						top: canvas.height! / 2 - (img.height! * scale) / 2
					});

					canvas.add(img);
					canvas.setActiveObject(img);
					canvas.renderAll();

					const objData = img.toObject();
					// @ts-expect-error
					objData.id = img.id;
					sendCanvasUpdate({
						type: 'add',
						object: objData
					});
				})
				.catch((error) => {
					console.error('Error loading image:', error);
					alert('Error loading image. Please try a different file.');
				});
		};

		reader.readAsDataURL(file);

		// Reset the input value so the same file can be selected again
		target.value = '';
	};

	const setLineTool = () => {
		selectedTool = 'line';
		showFloatingMenu = true;
		clearEraserState();
		clearShapeDrawingState();
		if (!canvas) return;
		canvas.isDrawingMode = false;
		canvas.selection = false;
		canvas.defaultCursor = 'crosshair';
		canvas.hoverCursor = 'crosshair';
	};

	const setArrowTool = () => {
		selectedTool = 'arrow';
		showFloatingMenu = true;
		clearEraserState();
		clearShapeDrawingState();
		if (!canvas) return;
		canvas.isDrawingMode = false;
		canvas.selection = false;
		canvas.defaultCursor = 'crosshair';
		canvas.hoverCursor = 'crosshair';
	};

	const createArrowHead = (
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		arrowLength = 15,
		arrowAngle = Math.PI / 6
	) => {
		const angle = Math.atan2(y2 - y1, x2 - x1);

		// Calculate the two points of the arrowhead
		const arrowPoint1 = {
			x: x2 - arrowLength * Math.cos(angle - arrowAngle),
			y: y2 - arrowLength * Math.sin(angle - arrowAngle)
		};

		const arrowPoint2 = {
			x: x2 - arrowLength * Math.cos(angle + arrowAngle),
			y: y2 - arrowLength * Math.sin(angle + arrowAngle)
		};

		return [arrowPoint1, arrowPoint2];
	};

	const createLine = (x1: number, y1: number, x2: number, y2: number) => {
		return new fabric.Line([x1, y1, x2, y2], {
			id: uuidv4(),
			stroke: '#000000',
			strokeWidth: 2,
			strokeDashArray: [],
			opacity: 1,
			selectable: true
		});
	};

	const createArrow = (x1: number, y1: number, x2: number, y2: number) => {
		const line = createLine(x1, y1, x2, y2);
		const arrowHeadPoints = createArrowHead(x1, y1, x2, y2);

		const arrowHead1 = new fabric.Line([x2, y2, arrowHeadPoints[0].x, arrowHeadPoints[0].y], {
			stroke: '#000000',
			strokeWidth: 2,
			strokeDashArray: [],
			opacity: 1,
			selectable: false
		});

		const arrowHead2 = new fabric.Line([x2, y2, arrowHeadPoints[1].x, arrowHeadPoints[1].y], {
			stroke: '#000000',
			strokeWidth: 2,
			strokeDashArray: [],
			opacity: 1,
			selectable: false
		});

		// Group the line and arrowhead together
		const arrowGroup = new fabric.Group([line, arrowHead1, arrowHead2], {
			selectable: true
		});

		return arrowGroup;
	};

	const createShapeFromPoints = (
		shapeType: string,
		x1: number,
		y1: number,
		x2: number,
		y2: number
	) => {
		// Calculate dimensions from the two points
		const left = Math.min(x1, x2);
		const top = Math.min(y1, y2);
		const width = Math.abs(x2 - x1);
		const height = Math.abs(y2 - y1);

		let shape: fabric.Object;

		switch (shapeType) {
			case 'circle':
				// For circles, use the larger dimension as diameter
				const radius = Math.max(width, height) / 2;
				shape = new fabric.Circle({
					id: uuidv4(),
					radius: radius,
					fill: 'transparent',
					stroke: '#000000',
					strokeWidth: 2,
					strokeDashArray: [],
					opacity: 1,
					left: left,
					top: top
				});
				break;
			case 'rectangle':
				shape = new fabric.Rect({
					id: uuidv4(),
					width: width,
					height: height,
					fill: 'transparent',
					stroke: '#000000',
					strokeWidth: 2,
					strokeDashArray: [],
					opacity: 1,
					left: left,
					top: top
				});
				break;
			case 'triangle':
				shape = new fabric.Triangle({
					id: uuidv4(),
					width: width,
					height: height,
					fill: 'transparent',
					stroke: '#000000',
					strokeWidth: 2,
					strokeDashArray: [],
					opacity: 1,
					left: left,
					top: top
				});
				break;
			default:
				return null;
		}

		return shape;
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

	const zoomIn = () => {
		if (!canvas) return;
		const newZoom = Math.min(canvas.getZoom() * 1.2, 10);
		const center = new fabric.Point(canvas.width! / 2, canvas.height! / 2);
		canvas.zoomToPoint(center, newZoom);
		currentZoom = newZoom;
	};

	const zoomOut = () => {
		if (!canvas) return;
		const newZoom = Math.max(canvas.getZoom() / 1.2, 0.1);
		const center = new fabric.Point(canvas.width! / 2, canvas.height! / 2);
		canvas.zoomToPoint(center, newZoom);
		currentZoom = newZoom;
	};

	const resetZoom = () => {
		if (!canvas) return;
		canvas.setZoom(1);
		currentZoom = 1;
	};

	const recenterView = () => {
		if (!canvas) return;
		// Reset the viewport transform to center the view
		canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
		// Update the zoom state to match the reset zoom level
		currentZoom = 1;
		canvas.renderAll();
	};

	const goBack = () => {
		goto(`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}`);
	};

	// Handle floating menu option changes
	const handleTextOptionsChange = (options: any) => {
		if (!canvas) return;
		const activeObject = canvas.getActiveObject();
		if (activeObject && activeObject.type === 'textbox') {
			activeObject.set({
				fontSize: options.fontSize,
				fontFamily: options.fontFamily,
				fontWeight: options.fontWeight,
				fill: options.colour,
				textAlign: options.textAlign,
				opacity: options.opacity
			});
			canvas.renderAll();
			const objData = activeObject.toObject();
			// @ts-expect-error
			objData.id = activeObject.id;
			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};

	const handleShapeOptionsChange = (options: any) => {
		if (!canvas) return;
		const activeObject = canvas.getActiveObject();
		if (
			activeObject &&
			(activeObject.type === 'rect' ||
				activeObject.type === 'circle' ||
				activeObject.type === 'triangle' ||
				activeObject.type === 'image')
		) {
			// For images, only apply opacity (other properties don't make sense for images)
			if (activeObject.type === 'image') {
				activeObject.set({
					opacity: options.opacity
				});
			} else {
				activeObject.set({
					strokeWidth: options.strokeWidth,
					stroke: options.strokeColour,
					fill: options.fillColour === 'transparent' ? 'transparent' : options.fillColour,
					strokeDashArray: options.strokeDashArray,
					opacity: options.opacity
				});
			}
			canvas.renderAll();
			const objData = activeObject.toObject();
			// @ts-expect-error
			objData.id = activeObject.id;
			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
	};

	const handleDrawOptionsChange = (options: any) => {
		if (!canvas) return;
		if (canvas.freeDrawingBrush) {
			canvas.freeDrawingBrush.width = options.brushSize;

			// Apply opacity to the colour by converting to rgba format
			const colour = options.brushColour;
			const opacity = options.opacity;

			// Convert hex colour to rgba with opacity
			const hexToRgba = (hex: string, alpha: number) => {
				const r = parseInt(hex.slice(1, 3), 16);
				const g = parseInt(hex.slice(3, 5), 16);
				const b = parseInt(hex.slice(5, 7), 16);
				return `rgba(${r}, ${g}, ${b}, ${alpha})`;
			};

			canvas.freeDrawingBrush.color = hexToRgba(colour, opacity);

			// Update brush type if needed
			if (options.brushType === 'circle') {
				canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
			} else if (options.brushType === 'spray') {
				canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
			} else {
				canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
			}
			canvas.freeDrawingBrush.width = options.brushSize;
			canvas.freeDrawingBrush.color = hexToRgba(colour, opacity);
		}
	};

	const handleLineArrowOptionsChange = (options: any) => {
		if (!canvas) return;
		const activeObject = canvas.getActiveObject();
		if (activeObject && (activeObject.type === 'line' || activeObject.type === 'group')) {
			if (activeObject.type === 'line') {
				activeObject.set({
					strokeWidth: options.strokeWidth,
					stroke: options.strokeColour,
					strokeDashArray: options.strokeDashArray,
					opacity: options.opacity
				});
			} else if (activeObject.type === 'group') {
				// Handle arrow group - update all objects in the group
				(activeObject as fabric.Group).forEachObject((obj: any) => {
					if (obj.type === 'line') {
						obj.set({
							strokeWidth: options.strokeWidth,
							stroke: options.strokeColour,
							strokeDashArray: options.strokeDashArray,
							opacity: options.opacity
						});
					}
				});
			}
			canvas.renderAll();
			const objData = activeObject.toObject();
			// @ts-expect-error
			objData.id = activeObject.id;
			sendCanvasUpdate({
				type: 'modify',
				object: objData
			});
		}
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

		document.body.style.overflow = 'hidden';

		canvas = new fabric.Canvas(whiteboardCanvas);

		const resizeCanvas = () => {
			if (!whiteboardCanvas || !canvas) return;
			const whiteContainer = whiteboardCanvas.closest('.rounded-lg.border-2.bg-white');
			if (whiteContainer) {
				const rect = whiteContainer.getBoundingClientRect();
				const width = rect.width - 4;
				const height = rect.height - 4;

				whiteboardCanvas.width = width;
				whiteboardCanvas.height = height;

				canvas.setDimensions({
					width: width,
					height: height
				});
				canvas.renderAll();
			}
		};

		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
		canvas.freeDrawingBrush.width = 2;
		canvas.freeDrawingBrush.color = '#000000';

		setSelectTool();

		socket = new WebSocket(
			`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${taskId}/whiteboard/ws`
		);

		socket.addEventListener('open', () => {
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
				if (messageData.whiteboardId !== whiteboardIdNum) return;

				if (messageData.type === 'load') {
					if (messageData.whiteboard.objects.length > 0) {
						const objects = await fabric.util.enlivenObjects(messageData.whiteboard.objects);
						canvas.clear();
						objects.forEach((obj: any) => {
							// Preserve the custom id property
							if (
								messageData.whiteboard.objects.find(
									(o: any) => o.id && o.left === obj.left && o.top === obj.top
								)
							) {
								const originalObj = messageData.whiteboard.objects.find(
									(o: any) => o.id && o.left === obj.left && o.top === obj.top
								);
								obj.id = originalObj.id;
							}

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
						// Preserve the custom id property
						// @ts-expect-error
						obj.id = messageData.object.id;
						canvas.add(obj as fabric.FabricObject);
						canvas.renderAll();
					}
				} else if (messageData.type === 'modify' || messageData.type === 'update') {
					const objects = canvas.getObjects();
					// @ts-expect-error
					const obj = objects.find((o) => o.id === messageData.object.id);
					if (obj) {
						// For live image updates, only update the essential properties to reduce lag
						const isLiveUpdate = messageData.live || false;
						if (isLiveUpdate && messageData.object.type === 'image') {
							// Only update positioning and transformation properties for live image updates
							obj.set({
								left: messageData.object.left,
								top: messageData.object.top,
								scaleX: messageData.object.scaleX,
								scaleY: messageData.object.scaleY,
								angle: messageData.object.angle,
								opacity: messageData.object.opacity
							});
						} else {
							// Full update for final modifications or non-image objects
							obj.set(messageData.object);
						}
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

		canvas.on('object:moving', ({ target }) => {
			const objData = target.toObject();
			// @ts-expect-error
			objData.id = target.id;

			// Only throttle image movements, send immediate updates for other objects
			if (target.type === 'image') {
				isMovingImage = true;
				// @ts-expect-error
				sendImageUpdate(target.id, objData, false);
			} else {
				// Immediate updates for non-image objects
				sendCanvasUpdate({
					type: 'modify',
					object: objData
				});
			}
		});

		canvas.on('object:scaling', ({ target }) => {
			const objData = target.toObject();
			// @ts-expect-error
			objData.id = target.id;

			// Only throttle image scaling, send immediate updates for other objects
			if (target.type === 'image') {
				isMovingImage = true;
				// @ts-expect-error
				sendImageUpdate(target.id, objData, false);
			} else {
				// Immediate updates for non-image objects
				sendCanvasUpdate({
					type: 'modify',
					object: objData
				});
			}
		});

		canvas.on('object:rotating', ({ target }) => {
			const objData = target.toObject();
			// @ts-expect-error
			objData.id = target.id;

			// Only throttle image rotation, send immediate updates for other objects
			if (target.type === 'image') {
				isMovingImage = true;
				// @ts-expect-error
				sendImageUpdate(target.id, objData, false);
			} else {
				// Immediate updates for non-image objects
				sendCanvasUpdate({
					type: 'modify',
					object: objData
				});
			}
		});

		canvas.on('object:modified', ({ target }) => {
			// This handles final modifications - always send immediately for persistence
			const objData = target.toObject();
			// @ts-expect-error
			objData.id = target.id;

			if (target.type === 'image') {
				// @ts-expect-error
				sendImageUpdate(target.id, objData, true);
				isMovingImage = false;
			} else {
				// Immediate updates for non-image objects
				sendCanvasUpdate({
					type: 'modify',
					object: objData
				});
			}
		});

		// Add mouse up event to ensure final position is saved for images
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
				} else if (selectedTool === 'line' || selectedTool === 'arrow') {
					canvas.setCursor('crosshair');
				} else if (selectedTool === 'shapes') {
					canvas.setCursor('crosshair');
				}
			}

			// Handle shape completion
			if (isDrawingShape && tempShape) {
				// Finalize the shape
				tempShape.set({ selectable: true });
				canvas.setActiveObject(tempShape);
				canvas.renderAll();

				// Send the completed shape to other users
				const objData = tempShape.toObject();
				// @ts-expect-error
				objData.id = tempShape.id;
				sendCanvasUpdate({
					type: 'add',
					object: objData
				});

				// Auto-switch to selection tool while keeping floating menu open
				selectedTool = 'select';
				canvas.isDrawingMode = false;
				canvas.selection = true;
				canvas.defaultCursor = 'default';
				canvas.hoverCursor = 'move';

				// Reset shape drawing state
				isDrawingShape = false;
				currentShapeType = '';
				tempShape = null;
			}

			// Handle line and arrow completion
			if ((isDrawingLine || isDrawingArrow) && tempLine) {
				// Set the object as selectable and finish the drawing
				tempLine.set({ selectable: true });
				canvas.setActiveObject(tempLine);
				canvas.renderAll();

				// Send the completed line/arrow to other users
				const objData = tempLine.toObject();
				// @ts-expect-error
				objData.id = tempLine.id;
				sendCanvasUpdate({
					type: 'add',
					object: objData
				});

				// Auto-switch to selection tool while keeping floating menu open
				selectedTool = 'select';
				canvas.isDrawingMode = false;
				canvas.selection = true;
				canvas.defaultCursor = 'default';
				canvas.hoverCursor = 'move';

				// Reset drawing state
				isDrawingLine = false;
				isDrawingArrow = false;
				tempLine = null;
			}

			// Handle eraser completion
			if (isErasing) {
				isErasing = false;

				// Delete all objects that were marked for deletion
				hoveredObjectsForDeletion.forEach((obj) => {
					canvas.remove(obj);
					// Send delete message to other users
					sendCanvasUpdate({
						type: 'delete',
						object: { id: (obj as any).id }
					});
				});

				// Clear eraser state
				clearEraserState();
			}

			// If we were moving an image, ensure final position is sent
			if (isMovingImage) {
				const activeObject = canvas.getActiveObject();
				if (activeObject && activeObject.type === 'image') {
					const objData = activeObject.toObject();
					// @ts-expect-error
					objData.id = activeObject.id;
					// @ts-expect-error
					sendImageUpdate(activeObject.id, objData, true);
				}
				isMovingImage = false;
			}
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
			zoom *= 0.99 ** delta;
			if (zoom > 10) zoom = 10;
			if (zoom < 0.1) zoom = 0.1;

			const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
			canvas.zoomToPoint(point, zoom);
			currentZoom = zoom;
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
				if (!canvas.getActiveObject() && !canvas.findTarget(evt)) {
					isPanMode = true;
					canvas.selection = false;
					canvas.setCursor('grab');

					const clientX = 'clientX' in evt ? evt.clientX : evt.touches?.[0]?.clientX || 0;
					const clientY = 'clientY' in evt ? evt.clientY : evt.touches?.[0]?.clientY || 0;
					panStartPos = { x: clientX, y: clientY };

					opt.e.preventDefault();
				}
			} else if (selectedTool === 'shapes' && currentShapeType) {
				if (!isDrawingShape) {
					// Start drawing a shape
					const pointer = canvas.getScenePoint(opt.e);
					startPoint = { x: pointer.x, y: pointer.y };
					isDrawingShape = true;

					// Create initial shape with zero size
					tempShape = createShapeFromPoints(
						currentShapeType,
						pointer.x,
						pointer.y,
						pointer.x,
						pointer.y
					);
					if (tempShape) {
						canvas.add(tempShape);
						canvas.renderAll();
					}

					opt.e.preventDefault();
					opt.e.stopPropagation();
				}
			} else if (selectedTool === 'line' || selectedTool === 'arrow') {
				if (!isDrawingLine && !isDrawingArrow) {
					const pointer = canvas.getScenePoint(opt.e);
					startPoint = { x: pointer.x, y: pointer.y };

					if (selectedTool === 'line') {
						isDrawingLine = true;
						tempLine = createLine(startPoint.x, startPoint.y, startPoint.x, startPoint.y);
					} else {
						isDrawingArrow = true;
						tempLine = createArrow(startPoint.x, startPoint.y, startPoint.x, startPoint.y) as any;
					}

					if (tempLine) {
						canvas.add(tempLine);
						canvas.renderAll();
					}

					opt.e.preventDefault();
					opt.e.stopPropagation();
				}
			} else if (selectedTool === 'eraser') {
				isErasing = true;
				const pointer = canvas.getScenePoint(opt.e);
				startPoint = { x: pointer.x, y: pointer.y };
				lastEraserPoint = { x: pointer.x, y: pointer.y };

				// Find objects under the eraser and make them transparent
				canvas.forEachObject((obj) => {
					if (obj.containsPoint(pointer) && !eraserTrail.includes(obj)) {
						if (!hoveredObjectsForDeletion.includes(obj)) {
							// Store original opacity and make transparent
							originalOpacities.set(obj, obj.opacity || 1);
							obj.set({ opacity: 0.3 });
							hoveredObjectsForDeletion.push(obj);
						}
					}
				});

				canvas.renderAll();
				opt.e.preventDefault();
				opt.e.stopPropagation();
			}
		});

		canvas.on('mouse:move', (opt) => {
			if (isPanMode) {
				const e = opt.e;
				const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX || 0;
				const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY || 0;

				const deltaX = clientX - panStartPos.x;
				const deltaY = clientY - panStartPos.y;

				canvas.relativePan(new fabric.Point(deltaX, deltaY));
				panStartPos = { x: clientX, y: clientY };

				canvas.setCursor('grabbing');
			} else if (isDrawingShape && tempShape && currentShapeType) {
				// Update the shape being drawn
				const pointer = canvas.getScenePoint(opt.e);

				// Remove the old temp shape
				canvas.remove(tempShape);

				// Create new shape with updated dimensions
				tempShape = createShapeFromPoints(
					currentShapeType,
					startPoint.x,
					startPoint.y,
					pointer.x,
					pointer.y
				);
				if (tempShape) {
					canvas.add(tempShape);
					canvas.renderAll();
				}
			} else if ((isDrawingLine || isDrawingArrow) && tempLine) {
				// Update the temporary line/arrow while dragging
				const pointer = canvas.getScenePoint(opt.e);

				if (isDrawingLine) {
					// Update line coordinates
					tempLine.set({
						x2: pointer.x,
						y2: pointer.y
					});
				} else if (isDrawingArrow) {
					// Remove the temp arrow and create a new one
					if (tempLine) {
						canvas.remove(tempLine);
					}
					tempLine = createArrow(startPoint.x, startPoint.y, pointer.x, pointer.y) as any;
					if (tempLine) {
						canvas.add(tempLine);
					}
				}

				canvas.renderAll();
			} else if (isErasing && selectedTool === 'eraser') {
				// Create visual eraser trail as a solid line
				const pointer = canvas.getScenePoint(opt.e);

				// Create a line segment from the last point to current point
				if (lastEraserPoint) {
					const trailLine = new fabric.Line(
						[lastEraserPoint.x, lastEraserPoint.y, pointer.x, pointer.y],
						{
							stroke: 'rgba(170, 170, 170, 0.4)',
							strokeWidth: 5,
							selectable: false,
							evented: false,
							excludeFromExport: true
						}
					);

					canvas.add(trailLine);
					eraserTrail.push(trailLine);

					// Limit trail length for performance
					if (eraserTrail.length > 15) {
						const oldTrail = eraserTrail.shift();
						if (oldTrail) canvas.remove(oldTrail);
					}
				}

				lastEraserPoint = { x: pointer.x, y: pointer.y };

				// Find objects under the eraser and make them transparent
				canvas.forEachObject((obj) => {
					if (obj.containsPoint(pointer) && !eraserTrail.includes(obj)) {
						if (!hoveredObjectsForDeletion.includes(obj)) {
							// Store original opacity and make transparent
							originalOpacities.set(obj, obj.opacity || 1);
							obj.set({ opacity: 0.3 });
							hoveredObjectsForDeletion.push(obj);
						}
					}
				});

				canvas.renderAll();
			} else if (selectedTool === 'eraser' && !isErasing) {
				// Show hover preview when not actively erasing
				const pointer = canvas.getScenePoint(opt.e);

				// Reset any previously hovered objects
				hoveredObjectsForDeletion.forEach((obj) => {
					const originalOpacity = originalOpacities.get(obj);
					if (originalOpacity !== undefined) {
						obj.set({ opacity: originalOpacity });
					}
				});
				hoveredObjectsForDeletion = [];
				originalOpacities.clear();

				// Find and highlight objects under cursor
				canvas.forEachObject((obj) => {
					if (obj.containsPoint(pointer) && !eraserTrail.includes(obj)) {
						originalOpacities.set(obj, obj.opacity || 1);
						obj.set({ opacity: 0.5 });
						hoveredObjectsForDeletion.push(obj);
					}
				});

				canvas.renderAll();
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
				const constrainedZoom = Math.max(0.1, Math.min(10, newZoom));

				// Zoom at center of pinch gesture
				const centerX = (touch1.clientX + touch2.clientX) / 2;
				const centerY = (touch1.clientY + touch2.clientY) / 2;

				if (whiteboardCanvas) {
					const rect = whiteboardCanvas.getBoundingClientRect();
					const point = new fabric.Point(centerX - rect.left, centerY - rect.top);
					canvas.zoomToPoint(point, constrainedZoom);
					currentZoom = constrainedZoom; // Update zoom state
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
			window.removeEventListener('resize', resizeCanvas);
		};
	});

	onDestroy(() => {
		// Restore body scrolling when leaving whiteboard
		document.body.style.overflow = '';

		// Clear any pending image throttle timeouts
		if (imageThrottleTimeout !== null) {
			clearTimeout(imageThrottleTimeout);
		}

		if (socket) {
			socket.close();
		}
		if (canvas) {
			canvas.dispose();
		}
	});
</script>

<Tooltip.Provider delayDuration={300}>
	<div class="bg-background flex h-full w-full flex-col">
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

		<!-- Whiteboard Canvas -->
		<main class="relative flex flex-1 items-center justify-center overflow-hidden p-4">
			<!-- Floating Toolbar -->
			<div class="absolute top-8 left-1/2 z-10 -translate-x-1/2 transform">
				<div
					class="bg-background/95 supports-[backdrop-filter]:bg-background/60 rounded-md border shadow-sm backdrop-blur"
				>
					<div class="flex items-center gap-1 px-4 py-2">
						<!-- Selection Tool -->
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant={selectedTool === 'select' ? 'default' : 'ghost'}
									size="icon"
									onclick={setSelectTool}
									class="h-9 w-9"
								>
									<MousePointerIcon />
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
									<HandIcon />
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
									<PenToolIcon />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Draw</Tooltip.Content>
						</Tooltip.Root>

						<!-- Line Tool -->
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant={selectedTool === 'line' ? 'default' : 'ghost'}
									size="icon"
									onclick={setLineTool}
									class="h-9 w-9"
								>
									<MinusIcon />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Draw Line</Tooltip.Content>
						</Tooltip.Root>

						<!-- Arrow Tool -->
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant={selectedTool === 'arrow' ? 'default' : 'ghost'}
									size="icon"
									onclick={setArrowTool}
									class="h-9 w-9"
								>
									<ArrowRightIcon />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Draw Arrow</Tooltip.Content>
						</Tooltip.Root>

						<!-- Shapes Dropdown -->
						<Tooltip.Root>
							<Tooltip.Trigger>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button {...props} variant="ghost" size="icon" class="h-9 w-9">
												<SquareIcon />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content>
										<DropdownMenu.Item onclick={() => addShape('rectangle')}>
											<SquareIcon />
											Rectangle
										</DropdownMenu.Item>
										<DropdownMenu.Item onclick={() => addShape('circle')}>
											<CircleIcon />
											Circle
										</DropdownMenu.Item>
										<DropdownMenu.Item onclick={() => addShape('triangle')}>
											<TriangleIcon />
											Triangle
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Tooltip.Trigger>
							<Tooltip.Content>Add Shapes</Tooltip.Content>
						</Tooltip.Root>
						<!-- Text Tool -->
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button variant="ghost" size="icon" onclick={addText} class="h-9 w-9">
									<TypeIcon />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Add Text</Tooltip.Content>
						</Tooltip.Root>

						<!-- Image Tool -->
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button variant="ghost" size="icon" onclick={addImage} class="h-9 w-9">
									<ImageIcon />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Upload Image</Tooltip.Content>
						</Tooltip.Root>

						<div class="bg-border mx-1 h-6 w-px"></div>

						<!-- Eraser Tool -->
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant={selectedTool === 'eraser' ? 'default' : 'ghost'}
									size="icon"
									onclick={setEraserTool}
									class="h-9 w-9"
								>
									<EraseIcon />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Eraser</Tooltip.Content>
						</Tooltip.Root>

						<!-- Clear Canvas -->
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button variant="ghost" size="icon" onclick={clearCanvas} class="h-9 w-9">
									<TrashIcon />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content>Clear All</Tooltip.Content>
						</Tooltip.Root>
					</div>
				</div>
			</div>

			<div class="flex h-full w-full rounded-lg border-2 bg-white shadow-lg dark:bg-neutral-700">
				<canvas bind:this={whiteboardCanvas} class="h-full w-full"></canvas>
			</div>

			<!-- Hidden file input for image uploads -->
			<input
				bind:this={imageInput}
				type="file"
				accept="image/*"
				onchange={handleImageUpload}
				class="hidden"
			/>

			<!-- Floating Menu -->
			<WhiteboardFloatingMenu
				{selectedTool}
				visible={showFloatingMenu}
				onTextOptionsChange={handleTextOptionsChange}
				onShapeOptionsChange={handleShapeOptionsChange}
				onDrawOptionsChange={handleDrawOptionsChange}
				onLineArrowOptionsChange={handleLineArrowOptionsChange}
			/>

			<!-- Zoom Controls -->
			<div class="absolute bottom-8 left-8">
				<div class="bg-background flex items-center gap-1 rounded-md border px-2 py-1 shadow-sm">
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button variant="ghost" size="icon" onclick={zoomOut} class="h-8 w-8">
								<ZoomOutIcon />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>Zoom Out</Tooltip.Content>
					</Tooltip.Root>

					<Button variant="ghost" size="sm" onclick={resetZoom} class="h-8 px-2 font-mono text-xs">
						{Math.round(currentZoom * 100)}%
					</Button>

					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button variant="ghost" size="icon" onclick={zoomIn} class="h-8 w-8">
								<ZoomInIcon />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>Zoom In</Tooltip.Content>
					</Tooltip.Root>

					<div class="bg-border mx-1 h-6 w-px"></div>

					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button variant="ghost" size="icon" onclick={recenterView} class="h-8 w-8">
								<HomeIcon />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>Recenter View</Tooltip.Content>
					</Tooltip.Root>
				</div>
			</div>
		</main>
	</div>
</Tooltip.Provider>
