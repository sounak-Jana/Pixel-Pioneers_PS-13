import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.graphId = null;
    this.listeners = new Map();
  }

  connect(serverUrl = 'http://localhost:3001') {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('🔗 Connected to server');
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.emit('error', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGraph(graphId) {
    this.graphId = graphId;
    if (this.socket) {
      this.socket.emit('join-graph', graphId);
    }
  }

  leaveGraph() {
    if (this.graphId && this.socket) {
      this.socket.emit('leave-graph', this.graphId);
      this.graphId = null;
    }
  }

  // Node operations
  createNode(node) {
    if (this.socket && this.graphId) {
      this.socket.emit('create-node', {
        graphId: this.graphId,
        node
      });
    }
  }

  updateNode(nodeId, updates) {
    if (this.socket && this.graphId) {
      this.socket.emit('update-node', {
        graphId: this.graphId,
        nodeId,
        updates
      });
    }
  }

  deleteNode(nodeId) {
    if (this.socket && this.graphId) {
      this.socket.emit('delete-node', {
        graphId: this.graphId,
        nodeId
      });
    }
  }

  // Edge operations
  createEdge(edge) {
    if (this.socket && this.graphId) {
      this.socket.emit('create-edge', {
        graphId: this.graphId,
        edge
      });
    }
  }

  updateEdge(edgeId, updates) {
    if (this.socket && this.graphId) {
      this.socket.emit('update-edge', {
        graphId: this.graphId,
        edgeId,
        updates
      });
    }
  }

  deleteEdge(edgeId) {
    if (this.socket && this.graphId) {
      this.socket.emit('delete-edge', {
        graphId: this.graphId,
        edgeId
      });
    }
  }

  // Cursor and selection operations
  updateCursor(position) {
    if (this.socket && this.graphId) {
      this.socket.emit('cursor-move', {
        graphId: this.graphId,
        position
      });
    }
  }

  updateSelection(selectedElements) {
    if (this.socket && this.graphId) {
      this.socket.emit('select-elements', {
        graphId: this.graphId,
        selectedElements
      });
    }
  }

  // Event listeners
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket event callback:', error);
        }
      });
    }
  }

  // Connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  getCurrentGraph() {
    return this.graphId;
  }
}

export const socketService = new SocketService();
export default socketService;
