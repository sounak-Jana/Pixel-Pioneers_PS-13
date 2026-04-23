import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useGraphStore = create(
  subscribeWithSelector((set, get) => ({
    // Graph state
    nodes: [],
    edges: [],
    selectedNodes: [],
    selectedEdges: [],
    
    // Collaboration state
    userCursors: {},
    activeUsers: {},
    
    // UI state
    isLoading: false,
    error: null,
    
    // Node operations
    addNode: (node) => set((state) => ({
      nodes: [...state.nodes, node]
    })),
    
    updateNode: (nodeId, updates) => set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                properties: { 
                  ...node.data.properties, 
                  ...updates 
                }
              }
            }
          : node
      )
    })),
    
    deleteNode: (nodeId) => set((state) => ({
      nodes: state.nodes.filter(node => node.id !== nodeId),
      edges: state.edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId)
    })),
    
    // Edge operations
    addEdge: (edge) => set((state) => ({
      edges: [...state.edges, edge]
    })),
    
    updateEdge: (edgeId, updates) => set((state) => ({
      edges: state.edges.map(edge =>
        edge.id === edgeId
          ? { 
              ...edge, 
              data: { 
                ...edge.data, 
                properties: { 
                  ...edge.data.properties, 
                  ...updates 
                }
              }
            }
          : edge
      )
    })),
    
    deleteEdge: (edgeId) => set((state) => ({
      edges: state.edges.filter(edge => edge.id !== edgeId)
    })),
    
    // Selection operations
    setSelectedElements: (nodeIds, edgeIds) => set({
      selectedNodes: nodeIds || [],
      selectedEdges: edgeIds || []
    }),
    
    clearSelection: () => set({
      selectedNodes: [],
      selectedEdges: []
    }),
    
    // Collaboration operations
    updateUserCursor: (userId, position) => set((state) => ({
      userCursors: {
        ...state.userCursors,
        [userId]: {
          ...state.userCursors[userId],
          ...position,
          timestamp: Date.now()
        }
      }
    })),
    
    removeUserCursor: (userId) => set((state) => {
      const newCursors = { ...state.userCursors };
      delete newCursors[userId];
      return { userCursors: newCursors };
    }),
    
    updateActiveUser: (userId, userInfo) => set((state) => ({
      activeUsers: {
        ...state.activeUsers,
        [userId]: {
          ...userInfo,
          lastSeen: Date.now()
        }
      }
    })),
    
    removeActiveUser: (userId) => set((state) => {
      const newUsers = { ...state.activeUsers };
      delete newUsers[userId];
      return { activeUsers: newUsers };
    }),
    
    // Bulk operations
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    
    loadGraph: (graphData) => set({
      nodes: graphData.nodes || [],
      edges: graphData.edges || [],
      isLoading: false,
      error: null
    }),
    
    clearGraph: () => set({
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      userCursors: {},
      activeUsers: {}
    }),
    
    // UI state operations
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    
    // Utility functions
    getNodeById: (nodeId) => {
      const { nodes } = get();
      return nodes.find(node => node.id === nodeId);
    },
    
    getEdgeById: (edgeId) => {
      const { edges } = get();
      return edges.find(edge => edge.id === edgeId);
    },
    
    getConnectedNodes: (nodeId) => {
      const { nodes, edges } = get();
      const connectedNodeIds = new Set();
      
      edges.forEach(edge => {
        if (edge.from === nodeId) connectedNodeIds.add(edge.to);
        if (edge.to === nodeId) connectedNodeIds.add(edge.from);
      });
      
      return nodes.filter(node => connectedNodeIds.has(node.id));
    },
    
    getNodeConnections: (nodeId) => {
      const { edges } = get();
      return edges.filter(edge => edge.from === nodeId || edge.to === nodeId);
    },
    
    // Search functionality
    searchNodes: (query) => {
      const { nodes } = get();
      const lowerQuery = query.toLowerCase();
      
      return nodes.filter(node => 
        node.data.label.toLowerCase().includes(lowerQuery) ||
        node.data.properties?.description?.toLowerCase().includes(lowerQuery) ||
        node.data.properties?.tags?.some(tag => 
          tag.toLowerCase().includes(lowerQuery)
        )
      );
    },
    
    searchEdges: (query) => {
      const { edges } = get();
      const lowerQuery = query.toLowerCase();
      
      return edges.filter(edge =>
        edge.data.relationship.toLowerCase().includes(lowerQuery) ||
        edge.data.properties?.description?.toLowerCase().includes(lowerQuery)
      );
    }
  }))
);

// Selectors for common use cases
export const useGraphNodes = () => useGraphStore(state => state.nodes);
export const useGraphEdges = () => useGraphStore(state => state.edges);
export const useSelectedElements = () => useGraphStore(state => ({
  selectedNodes: state.selectedNodes,
  selectedEdges: state.selectedEdges
}));
export const useCollaborationState = () => useGraphStore(state => ({
  userCursors: state.userCursors,
  activeUsers: state.activeUsers
}));
export const useGraphLoading = () => useGraphStore(state => ({
  isLoading: state.isLoading,
  error: state.error
}));

export default useGraphStore;
