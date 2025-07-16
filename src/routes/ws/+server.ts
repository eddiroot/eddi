import type { RequestHandler } from './$types';
import { Server } from 'socket.io';

// Store active presentations
const presentations = new Map<string, Set<string>>(); // presentationId -> Set of socketIds

// This will be initialized when the server starts
let io: Server | null = null;

export const GET: RequestHandler = async ({ url, request }) => {
    // Check if this is a Socket.IO handshake request
    if (url.searchParams.get('EIO') || url.searchParams.get('transport')) {
        return new Response('Socket.IO endpoint - use Socket.IO client', { 
            status: 400,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
    }

    // Return info about the WebSocket endpoint
    return new Response(
        JSON.stringify({
            message: 'Socket.IO endpoint available',
            endpoint: '/ws',
            protocol: url.protocol === 'https:' ? 'wss:' : 'ws:',
            timestamp: new Date().toISOString(),
            transport: 'socket.io'
        }),
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
};

// Initialize Socket.IO server
export function _initializeSocketIO(httpServer: any) {
    if (io) return io;
    
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Configure this for production
            methods: ["GET", "POST"]
        },
        path: '/ws/socket.io/'
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle all message types
        socket.on('join_presentation', (data) => handleJoinPresentation(socket, data));
        socket.on('submit_answer', (data) => handleSubmitAnswer(socket, data));
        socket.on('start_presentation', (data) => handleStartPresentation(socket, data));
        socket.on('end_presentation', (data) => handleEndPresentation(socket, data));

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            
            // Clean up from presentations
            for (const [presentationId, socketIds] of presentations.entries()) {
                if (socketIds.has(socket.id)) {
                    socketIds.delete(socket.id);
                    
                    // Notify others in the presentation
                    socket.to(presentationId).emit('user_left', {
                        userId: (socket as any).userId,
                        userName: (socket as any).userName,
                        role: (socket as any).role
                    });
                    
                    // Remove empty presentations
                    if (socketIds.size === 0) {
                        presentations.delete(presentationId);
                    }
                    break;
                }
            }
        });
    });

    return io;
}

// Get the Socket.IO instance
export function _getSocketIO() {
    return io;
}

// Message handling functions (these would be called by your WebSocket server)
function handleMessage(socket: any, data: any) {
    console.log('Received message:', data);
    
    switch (data.type) {
        case 'join_presentation':
            handleJoinPresentation(socket, data);
            break;
            
        case 'submit_answer':
            handleSubmitAnswer(socket, data);
            break;
            
        case 'start_presentation':
            handleStartPresentation(socket, data);
            break;
            
        case 'end_presentation':
            handleEndPresentation(socket, data);
            break;
            
        default:
            socket.emit('error', { 
                message: `Unknown message type: ${data.type}` 
            });
    }
}

function handleJoinPresentation(socket: any, data: any) {
    const { presentationId, role, userId, userName } = data;
    
    if (!presentationId) {
        socket.emit('error', { 
            message: 'Presentation ID required' 
        });
        return;
    }
    
    // Store metadata on socket
    socket.presentationId = presentationId;
    socket.role = role;
    socket.userId = userId;
    socket.userName = userName;
    
    // Join the presentation room
    socket.join(presentationId);
    
    // Add to presentation tracking
    if (!presentations.has(presentationId)) {
        presentations.set(presentationId, new Set());
    }
    presentations.get(presentationId)!.add(socket.id);
    
    // Confirm connection
    socket.emit('joined_presentation', {
        presentationId,
        connectionId: socket.id,
        role
    });
    
    // Notify others in presentation
    socket.to(presentationId).emit('user_joined', {
        userId,
        userName,
        role
    });
    
    console.log(`User ${userName} (${role}) joined presentation ${presentationId}`);
}

function handleSubmitAnswer(socket: any, data: any) {
    const { blockId, answer, questionType } = data;
    const presentationId = socket.presentationId;
    const userId = socket.userId;
    const userName = socket.userName;
    
    if (!presentationId) {
        socket.emit('error', { 
            message: 'Not connected to a presentation' 
        });
        return;
    }
    
    // Broadcast answer to all teachers in the presentation
    socket.to(presentationId).emit('new_answer', {
        blockId,
        answer,
        questionType,
        userId,
        userName,
        timestamp: new Date().toISOString()
    });
    
    // Confirm to student
    socket.emit('answer_submitted', {
        blockId,
        timestamp: new Date().toISOString()
    });
    
    console.log(`Answer submitted by ${userName} for block ${blockId}`);
}

function handleStartPresentation(socket: any, data: any) {
    const { taskId } = data;
    const presentationId = `task_${taskId}`;
    const userId = socket.userId;
    const userName = socket.userName;
    
    // Update socket metadata
    socket.presentationId = presentationId;
    socket.role = 'teacher';
    
    // Join presentation room
    socket.join(presentationId);
    
    // Add to presentation tracking
    if (!presentations.has(presentationId)) {
        presentations.set(presentationId, new Set());
    }
    presentations.get(presentationId)!.add(socket.id);
    
    socket.emit('presentation_started', {
        presentationId,
        taskId
    });
    
    console.log(`Presentation started by ${userName} for task ${taskId}`);
}

function handleEndPresentation(socket: any, data: any) {
    const presentationId = socket.presentationId;
    
    if (presentationId) {
        // Notify all users in presentation
        socket.to(presentationId).emit('presentation_ended');
        
        // Clean up presentation
        presentations.delete(presentationId);
    }
    
    console.log(`Presentation ${presentationId} ended`);
}

// Export utilities for use in other parts of your app (prefixed with _ for SvelteKit)
export const _WebSocketUtils = {
    handleMessage,
    handleJoinPresentation,
    handleSubmitAnswer,
    handleStartPresentation,
    handleEndPresentation,
    presentations
};

