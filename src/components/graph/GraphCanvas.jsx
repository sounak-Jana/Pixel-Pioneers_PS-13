import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import socketService from '../../services/socket/socketService';
import { useGraphStore } from '../../stores/graphStore';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import NodeToolbar from './NodeToolbar';
import SearchPanel from './SearchPanel';
import UserCursors from './UserCursors';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const GraphCanvas = ({ graphId }) => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const {
    nodes,
    edges,
    selectedNodes,
    selectedEdges,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    deleteNode,
    addEdge: addGraphEdge,
    updateEdge,
    deleteEdge,
    setSelectedElements,
    userCursors,
    updateUserCursor
  } = useGraphStore();

  const [nodesState, setNodesState, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges);

  // Initialize socket connection
  useEffect(() => {
    if (graphId) {
      socketService.connect();
      socketService.joinGraph(graphId);

      // Listen for real-time updates
      socketService.on('node-created', handleNodeCreated);
      socketService.on('node-updated', handleNodeUpdated);
      socketService.on('node-deleted', handleNodeDeleted);
      socketService.on('edge-created', handleEdgeCreated);
      socketService.on('edge-updated', handleEdgeUpdated);
      socketService.on('edge-deleted', handleEdgeDeleted);
      socketService.on('cursor-position', handleCursorPosition);
      socketService.on('elements-selected', handleElementsSelected);

      return () => {
        socketService.off('node-created', handleNodeCreated);
        socketService.off('node-updated', handleNodeUpdated);
        socketService.off('node-deleted', handleNodeDeleted);
        socketService.off('edge-created', handleEdgeCreated);
        socketService.off('edge-updated', handleEdgeUpdated);
        socketService.off('edge-deleted', handleEdgeDeleted);
        socketService.off('cursor-position', handleCursorPosition);
        socketService.off('elements-selected', handleElementsSelected);
        socketService.leaveGraph();
      };
    }
  }, [graphId]);

  // Sync local state with store
  useEffect(() => {
    setNodesState(nodes);
    setEdgesState(edges);
  }, [nodes, edges, setNodesState, setEdgesState]);

  // Real-time event handlers
  const handleNodeCreated = useCallback((data) => {
    if (data.userId !== socketService.getSocketId()) {
      addNode(data.node);
    }
  }, [addNode]);

  const handleNodeUpdated = useCallback((data) => {
    if (data.userId !== socketService.getSocketId()) {
      updateNode(data.nodeId, data.node);
    }
  }, [updateNode]);

  const handleNodeDeleted = useCallback((data) => {
    if (data.userId !== socketService.getSocketId()) {
      deleteNode(data.nodeId);
    }
  }, [deleteNode]);

  const handleEdgeCreated = useCallback((data) => {
    if (data.userId !== socketService.getSocketId()) {
      addGraphEdge(data.edge);
    }
  }, [addGraphEdge]);

  const handleEdgeUpdated = useCallback((data) => {
    if (data.userId !== socketService.getSocketId()) {
      updateEdge(data.edgeId, data.edge);
    }
  }, [updateEdge]);

  const handleEdgeDeleted = useCallback((data) => {
    if (data.userId !== socketService.getSocketId()) {
      deleteEdge(data.edgeId);
    }
  }, [deleteEdge]);

  const handleCursorPosition = useCallback((data) => {
    updateUserCursor(data.userId, data.position);
  }, [updateUserCursor]);

  const handleElementsSelected = useCallback((data) => {
    if (data.userId !== socketService.getSocketId()) {
      // Show remote user's selection
      console.log('Remote user selected:', data.selectedElements);
    }
  }, []);

  // React Flow callbacks
  const onConnect = useCallback((params) => {
    const newEdge = {
      id: `edge-${Date.now()}`,
      source: params.source,
      target: params.target,
      relationship: 'related_to',
      properties: {},
      type: 'custom',
      markerEnd: { type: MarkerType.ArrowClosed }
    };

    addGraphEdge(newEdge);
    socketService.createEdge(newEdge);
  }, [addGraphEdge]);

  const onNodeDragStop = useCallback((event, node) => {
    const positionUpdate = {
      position: {
        x: node.position.x,
        y: node.position.y
      }
    };
    updateNode(node.id, positionUpdate);
    socketService.updateNode(node.id, positionUpdate);
  }, [updateNode]);

  const onPaneClick = useCallback((event) => {
    if (event.shiftKey && reactFlowInstance) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: 'New Concept',
          type: 'concept',
          properties: {}
        }
      };

      addNode(newNode);
      socketService.createNode(newNode);
    }
  }, [reactFlowInstance, addNode]);

  const onSelectionChange = useCallback((elements) => {
    const selectedNodeIds = elements?.nodes?.map(node => node.id) || [];
    const selectedEdgeIds = elements?.edges?.map(edge => edge.id) || [];
    setSelectedElements(selectedNodeIds, selectedEdgeIds);
    socketService.updateSelection([...selectedNodeIds, ...selectedEdgeIds]);
  }, [setSelectedElements]);

  const onMove = useCallback((event) => {
    if (reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      socketService.updateCursor(position);
    }
  }, []);

  const onInit = useCallback((rfi) => {
    setReactFlowInstance(rfi);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' && (selectedNodes.length > 0 || selectedEdges.length > 0)) {
        selectedNodes.forEach(nodeId => {
          deleteNode(nodeId);
          socketService.deleteNode(nodeId);
        });
        selectedEdges.forEach(edgeId => {
          deleteEdge(edgeId);
          socketService.deleteEdge(edgeId);
        });
      }
      
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, selectedEdges, deleteNode, deleteEdge]);

  return (
    <div 
      ref={reactFlowWrapper} 
      style={{ width: '100%', height: '100%' }}
      onMouseMove={onMove}
    >
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        attributionPosition="bottom-left"
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data.type) {
              case 'concept': return '#3b82f6';
              case 'definition': return '#10b981';
              case 'example': return '#f59e0b';
              case 'question': return '#ef4444';
              default: return '#6b7280';
            }
          }}
          position="top-right"
        />
        
        <Panel position="top-left">
          <NodeToolbar 
            onAddNode={() => setIsConnecting(true)}
            onToggleSearch={() => setShowSearch(!showSearch)}
          />
        </Panel>

        <Panel position="bottom-left">
          <UserCursors cursors={userCursors} />
        </Panel>

        {showSearch && (
          <Panel position="top-center">
            <SearchPanel
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onClose={() => setShowSearch(false)}
            />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default GraphCanvas;
