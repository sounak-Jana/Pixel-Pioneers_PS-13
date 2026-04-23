import { getSession } from '../config/database.js';

let io = null;

export const initializeSocket = (socketIo) => {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log(`🔗 User connected: ${socket.id}`);
    
    // Join graph room for real-time collaboration
    socket.on('join-graph', (graphId) => {
      socket.join(`graph-${graphId}`);
      console.log(`📊 User ${socket.id} joined graph ${graphId}`);
    });
    
    // Handle node creation
    socket.on('create-node', async (data) => {
      try {
        const { graphId, node } = data;
        const session = getSession();
        
        await session.run(
          `CREATE (n:Node {
            id: $id,
            label: $label,
            type: $type,
            properties: $properties,
            x: $x,
            y: $y,
            createdBy: $userId,
            createdAt: datetime(),
            updatedAt: datetime()
          })`,
          { ...node, userId: socket.id }
        );
        
        await session.close();
        
        // Broadcast to all users in the graph
        io.to(`graph-${graphId}`).emit('node-created', {
          node,
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle edge creation
    socket.on('create-edge', async (data) => {
      try {
        const { graphId, edge } = data;
        const session = getSession();
        
        await session.run(
          `MATCH (a:Node {id: $fromNode}), (b:Node {id: $toNode})
           CREATE (a)-[r:RELATIONSHIP {
             id: $id,
             relationship: $relationship,
             properties: $properties,
             createdBy: $userId,
             createdAt: datetime(),
             updatedAt: datetime()
           }]->(b)`,
          { ...edge, userId: socket.id }
        );
        
        await session.close();
        
        io.to(`graph-${graphId}`).emit('edge-created', {
          edge,
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle node updates
    socket.on('update-node', async (data) => {
      try {
        const { graphId, nodeId, updates } = data;
        const session = getSession();
        
        const result = await session.run(
          `MATCH (n:Node {id: $nodeId})
           SET n += $updates, n.updatedAt = datetime(), n.updatedBy = $userId
           RETURN n`,
          { nodeId, updates, userId: socket.id }
        );
        
        await session.close();
        
        const updatedNode = result.records[0].get('n').properties;
        
        io.to(`graph-${graphId}`).emit('node-updated', {
          nodeId,
          node: updatedNode,
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle edge updates
    socket.on('update-edge', async (data) => {
      try {
        const { graphId, edgeId, updates } = data;
        const session = getSession();
        
        const result = await session.run(
          `MATCH ()-[r:RELATIONSHIP {id: $edgeId}]->()
           SET r += $updates, r.updatedAt = datetime(), r.updatedBy = $userId
           RETURN r`,
          { edgeId, updates, userId: socket.id }
        );
        
        await session.close();
        
        const updatedEdge = result.records[0].get('r').properties;
        
        io.to(`graph-${graphId}`).emit('edge-updated', {
          edgeId,
          edge: updatedEdge,
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle node deletion
    socket.on('delete-node', async (data) => {
      try {
        const { graphId, nodeId } = data;
        const session = getSession();
        
        await session.run(
          `MATCH (n:Node {id: $nodeId})
           DETACH DELETE n`,
          { nodeId }
        );
        
        await session.close();
        
        io.to(`graph-${graphId}`).emit('node-deleted', {
          nodeId,
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle edge deletion
    socket.on('delete-edge', async (data) => {
      try {
        const { graphId, edgeId } = data;
        const session = getSession();
        
        await session.run(
          `MATCH ()-[r:RELATIONSHIP {id: $edgeId}]->()
           DELETE r`,
          { edgeId }
        );
        
        await session.close();
        
        io.to(`graph-${graphId}`).emit('edge-deleted', {
          edgeId,
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle cursor position for real-time collaboration
    socket.on('cursor-move', (data) => {
      const { graphId, position } = data;
      socket.to(`graph-${graphId}`).emit('cursor-position', {
        userId: socket.id,
        position,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle user selection
    socket.on('select-elements', (data) => {
      const { graphId, selectedElements } = data;
      socket.to(`graph-${graphId}`).emit('elements-selected', {
        userId: socket.id,
        selectedElements,
        timestamp: new Date().toISOString()
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
      
      // Notify other users about disconnection
      socket.rooms.forEach(room => {
        if (room.startsWith('graph-')) {
          socket.to(room).emit('user-disconnected', {
            userId: socket.id,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  });
};

export const broadcastToGraph = (graphId, event, data) => {
  if (io) {
    io.to(`graph-${graphId}`).emit(event, data);
  }
};
