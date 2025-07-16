import { writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';

export const socketStore = writable<Socket | null>(null);
export const isConnected = writable(false);

let socket: Socket | null = null;

// Only connect when actually needed
export function connectSocket() {
	if (!browser || socket?.connected) return socket;
	
	console.log('Connecting to WebSocket...');
	
	socket = io('/ws', {
		autoConnect: true,
		transports: ['websocket', 'polling']
	});
	
	socket.on('connect', () => {
		console.log('Connected to WebSocket');
		isConnected.set(true);
		socketStore.set(socket);
	});
	
	socket.on('disconnect', () => {
		console.log('Disconnected from WebSocket');
		isConnected.set(false);
	});
	
	socket.on('error', (error: any) => {
		console.error('WebSocket error:', error);
	});
	
	return socket;
}

export function disconnectSocket() {
	if (socket) {
		console.log('Disconnecting from WebSocket...');
		socket.disconnect();
		socket = null;
		socketStore.set(null);
		isConnected.set(false);
	}
}

// Utility functions for presentations
export function joinPresentation(taskId: string, role: 'teacher' | 'student', userId: string, userName: string) {
	const currentSocket = socket || connectSocket();
	if (currentSocket) {
		currentSocket.emit('join_presentation', {
			presentationId: `task_${taskId}`,
			role,
			userId,
			userName
		});
	}
}

export function leavePresentation(taskId: string) {
	if (socket) {
		socket.emit('leave_presentation', {
			presentationId: `task_${taskId}`
		});
	}
}

export function startPresentation(taskId: string, userId: string, userName: string) {
	const currentSocket = socket || connectSocket();
	if (currentSocket) {
		currentSocket.emit('start_presentation', {
			taskId,
			userId,
			userName
		});
	}
}

export function endPresentation() {
	if (socket) {
		socket.emit('end_presentation');
	}
}

export function submitAnswer(blockId: string, answer: any, questionType: string) {
	if (socket) {
		socket.emit('submit_answer', {
			blockId,
			answer,
			questionType
		});
	}
}

// Check if socket exists and is connected
export function getSocket() {
	return socket;
}

export function isSocketConnected() {
	return socket?.connected || false;
}
