import axios from 'axios';

class GraphService {
  constructor() {
    this.apiBase = import.meta.env.VITE_SERVER_URL || 'http://localhost:3002';
  }

  // Basic CRUD operations
  async getGraph() {
    try {
      const response = await axios.get(`${this.apiBase}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching graph:', error);
      throw error;
    }
  }

  async createNode(nodeData) {
    try {
      const response = await axios.post(`${this.apiBase}/nodes`, nodeData);
      return response.data;
    } catch (error) {
      console.error('Error creating node:', error);
      throw error;
    }
  }

  async updateNode(nodeId, updates) {
    try {
      const response = await axios.put(`${this.apiBase}/nodes/${nodeId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating node:', error);
      throw error;
    }
  }

  async deleteNode(nodeId) {
    try {
      const response = await axios.delete(`${this.apiBase}/nodes/${nodeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting node:', error);
      throw error;
    }
  }

  async createEdge(edgeData) {
    try {
      const response = await axios.post(`${this.apiBase}/edges`, edgeData);
      return response.data;
    } catch (error) {
      console.error('Error creating edge:', error);
      throw error;
    }
  }

  async updateEdge(edgeId, updates) {
    try {
      const response = await axios.put(`${this.apiBase}/edges/${edgeId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating edge:', error);
      throw error;
    }
  }

  async deleteEdge(edgeId) {
    try {
      const response = await axios.delete(`${this.apiBase}/edges/${edgeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting edge:', error);
      throw error;
    }
  }

  // Search functionality
  async searchNodes(query) {
    try {
      const response = await axios.get(`${this.apiBase}/search`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching nodes:', error);
      throw error;
    }
  }

  // Path finding
  async findPath(fromNodeId, toNodeId) {
    try {
      const response = await axios.get(`${this.apiBase}/path/${fromNodeId}/${toNodeId}`);
      return response.data;
    } catch (error) {
      console.error('Error finding path:', error);
      throw error;
    }
  }

  // Get connected nodes
  async getConnectedNodes(nodeId) {
    try {
      const response = await axios.get(`${this.apiBase}/nodes/${nodeId}/connected`);
      return response.data;
    } catch (error) {
      console.error('Error getting connected nodes:', error);
      throw error;
    }
  }

  // Advanced path search with multiple criteria
  async findMultiplePaths(startNode, endNodes, options = {}) {
    try {
      const paths = [];
      
      for (const endNode of endNodes) {
        const pathData = await this.findPath(startNode, endNode);
        if (pathData.path) {
          paths.push({
            to: endNode,
            path: pathData.path,
            length: this.calculatePathLength(pathData.path)
          });
        }
      }

      // Sort by path length
      return paths.sort((a, b) => a.length - b.length);
    } catch (error) {
      console.error('Error finding multiple paths:', error);
      throw error;
    }
  }

  // Find all paths between two nodes (up to a certain depth)
  async findAllPaths(startNode, endNode, maxDepth = 5) {
    try {
      const response = await axios.get(`${this.apiBase}/paths/all`, {
        params: { from: startNode, to: endNode, maxDepth }
      });
      return response.data;
    } catch (error) {
      console.error('Error finding all paths:', error);
      // Fallback to basic path finding
      const pathData = await this.findPath(startNode, endNode);
      return [pathData.path].filter(Boolean);
    }
  }

  // Find shortest paths from a node to all other nodes
  async findShortestPaths(startNode) {
    try {
      const response = await axios.get(`${this.apiBase}/paths/shortest/${startNode}`);
      return response.data;
    } catch (error) {
      console.error('Error finding shortest paths:', error);
      throw error;
    }
  }

  // Calculate path metrics
  calculatePathLength(path) {
    if (!path || !path.segments) return 0;
    return path.segments.length;
  }

  calculatePathWeight(path, weightFunction = () => 1) {
    if (!path || !path.segments) return 0;
    return path.segments.reduce((total, segment) => 
      total + weightFunction(segment), 0
    );
  }

  // Convert path to node sequence
  pathToNodeSequence(path) {
    if (!path || !path.segments) return [];
    
    const nodes = [];
    path.segments.forEach(segment => {
      nodes.push(segment.start);
      nodes.push(segment.end);
    });
    
    // Remove duplicates while preserving order
    return [...new Set(nodes)];
  }

  // Find paths that match specific criteria
  async findPathsByCriteria(startNode, criteria) {
    try {
      const response = await axios.get(`${this.apiBase}/paths/search`, {
        params: {
          from: startNode,
          ...criteria
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error finding paths by criteria:', error);
      throw error;
    }
  }

  // Analyze graph connectivity
  async analyzeConnectivity() {
    try {
      const response = await axios.get(`${this.apiBase}/analysis/connectivity`);
      return response.data;
    } catch (error) {
      console.error('Error analyzing connectivity:', error);
      throw error;
    }
  }

  // Find central nodes (betweenness centrality)
  async findCentralNodes() {
    try {
      const response = await axios.get(`${this.apiBase}/analysis/centrality`);
      return response.data;
    } catch (error) {
      console.error('Error finding central nodes:', error);
      throw error;
    }
  }

  // Get graph statistics
  async getGraphStats() {
    try {
      const response = await axios.get(`${this.apiBase}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error getting graph stats:', error);
      throw error;
    }
  }

  // Export graph data
  async exportGraph(format = 'json') {
    try {
      const response = await axios.get(`${this.apiBase}/export`, {
        params: { format }
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting graph:', error);
      throw error;
    }
  }

  // Import graph data
  async importGraph(data, format = 'json') {
    try {
      const response = await axios.post(`${this.apiBase}/import`, data, {
        params: { format }
      });
      return response.data;
    } catch (error) {
      console.error('Error importing graph:', error);
      throw error;
    }
  }
}

export const graphService = new GraphService();
export default graphService;
