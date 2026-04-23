import React, { useState, useEffect } from 'react';
import GraphCanvas from './components/graph/GraphCanvas';
import entityExtractionService from './services/ai/entityExtractionService';
import conflictResolutionService from './services/ai/conflictResolutionService';
import nodeExpansionService from './services/ai/nodeExpansionService';
import { useGraphStore } from './stores/graphStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  GitBranch, 
  MessageSquare, 
  Search, 
  Upload,
  FileText,
  Settings,
  Users
} from 'lucide-react';

// Import the original landing page components
import PixelGrid from './components/ui/PixelGrid';

function App() {
  const [currentGraphId, setCurrentGraphId] = useState('default-graph');
  const [showLanding, setShowLanding] = useState(true);
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showConflictPanel, setShowConflictPanel] = useState(false);
  const [showPathSearch, setShowPathSearch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { 
    nodes, 
    edges, 
    loadGraph, 
    addNode, 
    addEdge,
    clearGraph,
    userCursors 
  } = useGraphStore();

  // Initialize with sample data or load existing graph
  useEffect(() => {
    if (!showLanding) {
      loadSampleGraph();
    }
  }, [showLanding]);

  const loadSampleGraph = async () => {
    // Sample knowledge graph data for demonstration
    const sampleGraph = {
      nodes: [
        {
          id: 'node-1',
          type: 'custom',
          position: { x: 250, y: 100 },
          data: {
            label: 'Machine Learning',
            type: 'concept',
            properties: {
              description: 'The study of computer algorithms that improve automatically through experience',
              tags: ['AI', 'Algorithms', 'Data'],
              source: 'Textbook'
            }
          }
        },
        {
          id: 'node-2',
          type: 'custom',
          position: { x: 100, y: 250 },
          data: {
            label: 'Supervised Learning',
            type: 'concept',
            properties: {
              description: 'Learning from labeled training data',
              tags: ['ML', 'Training']
            }
          }
        },
        {
          id: 'node-3',
          type: 'custom',
          position: { x: 400, y: 250 },
          data: {
            label: 'Neural Networks',
            type: 'concept',
            properties: {
              description: 'Computing systems inspired by biological neural networks',
              tags: ['Deep Learning', 'AI']
            }
          }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          from: 'node-1',
          to: 'node-2',
          relationship: 'includes',
          properties: {
            confidence: 0.9
          },
          type: 'custom'
        },
        {
          id: 'edge-2',
          from: 'node-1',
          to: 'node-3',
          relationship: 'related_to',
          properties: {
            confidence: 0.8
          },
          type: 'custom'
        }
      ]
    };

    loadGraph(sampleGraph);
  };

  const handleTextProcessing = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      const result = await entityExtractionService.processTextInput(inputText, nodes);
      
      // Add new nodes and edges to the graph
      result.nodes.forEach(node => addNode(node));
      result.edges.forEach(edge => addEdge(edge));
      
      setInputText('');
      setShowTextInput(false);
      
      // Check for conflicts
      const conflicts = conflictResolutionService.detectConflicts(result.nodes, result.edges);
      if (conflicts.length > 0) {
        setShowConflictPanel(true);
      }
    } catch (error) {
      console.error('Error processing text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConflictResolution = async (conflicts) => {
    try {
      const resolutions = await conflictResolutionService.resolveConflicts(conflicts);
      // Apply resolutions...
      setShowConflictPanel(false);
    } catch (error) {
      console.error('Error resolving conflicts:', error);
    }
  };

  const handleNodeExpansion = async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    try {
      const expansions = await nodeExpansionService.analyzeNodeForExpansion(node, { nodes, edges });
      const result = await nodeExpansionService.createExpansionSuggestions(
        node, 
        expansions, 
        addNode, 
        addEdge
      );
      
      console.log('Expansion result:', result);
    } catch (error) {
      console.error('Error expanding node:', error);
    }
  };

  const handleExportGraph = () => {
    const graphData = { nodes, edges };
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGraph = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const graphData = JSON.parse(e.target.result);
        loadGraph(graphData);
      } catch (error) {
        console.error('Error importing graph:', error);
      }
    };
    reader.readAsText(file);
  };

  if (showLanding) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#0A0A0A",
        fontFamily: "'Space Mono', monospace",
      }}>
        <PixelGrid />
        
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#F5F5F0",
            animation: "fadeIn .8s ease forwards",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(60px, 10vw, 130px)",
              letterSpacing: "-0.04em",
              lineHeight: 0.9,
              animation: "devwrapGlow 3s ease-in-out infinite",
              textShadow: "0 0 20px rgba(0, 200, 150, 0.3)",
              marginBottom: 20
            }}
          >
            Knowledge Graph
          </div>

          <div
            style={{
              marginTop: 18,
              fontSize: 12,
              letterSpacing: "0.4em",
              color: "#00C896",
              textTransform: "uppercase",
              animation: "fadeUp .8s ease forwards",
              marginBottom: 40
            }}
          >
            Collaborative Learning Platform
          </div>

          <div
            style={{
              textAlign: "center",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 20,
              opacity: 0.75,
              animation: "fadeUp 1s ease forwards",
              marginBottom: 40
            }}
          >
            Transform your ideas into interconnected knowledge
            <br />
            <span style={{ opacity: 0.6, fontSize: 16 }}>
              Build, explore, and collaborate in real-time
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLanding(false)}
            style={{
              background: "#00C896",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              padding: "12px 32px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              animation: "fadeUp 1.2s ease forwards"
            }}
          >
            Start Building
          </motion.button>
        </div>

        <style>{`
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
          @keyframes fadeUp {
            from{opacity:0; transform:translateY(30px)}
            to{opacity:1; transform:translateY(0)}
          }
          @keyframes devwrapGlow {
            0%, 100% { text-shadow: 0 0 20px rgba(0, 200, 150, 0.3); }
            50% { text-shadow: 0 0 40px rgba(0, 232, 168, 0.6), 0 0 60px rgba(0, 200, 150, 0.4); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Main Graph Canvas */}
      <GraphCanvas graphId={currentGraphId} />

      {/* Floating Action Buttons */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {/* AI Text Input */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTextInput(true)}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Process Text with AI"
        >
          <Brain size={20} />
        </motion.button>

        {/* Node Expansion */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Expand first selected node or random node
            const selectedNode = nodes[0]; // Simplified for demo
            if (selectedNode) {
              handleNodeExpansion(selectedNode.id);
            }
          }}
          style={{
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Expand Node with AI"
        >
          <GitBranch size={20} />
        </motion.button>

        {/* Path Search */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPathSearch(true)}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Search Paths"
        >
          <Search size={20} />
        </motion.button>

        {/* Export/Import */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportGraph}
          style={{
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Export Graph"
        >
          <Upload size={20} />
        </motion.button>

        {/* Import */}
        <label
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Import Graph"
        >
          <FileText size={20} />
          <input
            type="file"
            accept=".json"
            onChange={handleImportGraph}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Status Bar */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '12px',
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981'
          }} />
          Connected
        </div>
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
        {Object.keys(userCursors).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={12} />
            {Object.keys(userCursors).length} active
          </div>
        )}
      </div>

      {/* Text Input Modal */}
      <AnimatePresence>
        {showTextInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setShowTextInput(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                width: '90%',
                maxWidth: '600px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Brain size={20} color="#10b981" />
                AI-Powered Knowledge Extraction
              </h2>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your text here to extract concepts, definitions, and relationships..."
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '16px'
              }}>
                <button
                  onClick={() => setShowTextInput(false)}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTextProcessing}
                  disabled={!inputText.trim() || isProcessing}
                  style={{
                    background: inputText.trim() && !isProcessing ? '#10b981' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: inputText.trim() && !isProcessing ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Extract Knowledge'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
