import React, { useState, useEffect } from 'react';
import GraphCanvas from './components/graph/GraphCanvas';
import PathSearchPanel from './components/graph/PathSearchPanel';
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
  const [inputText, setInputText] = useState('');
  const [showHelp, setShowHelp] = useState(false);
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
    userCursors,
    setSelectedElements
  } = useGraphStore();

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
          source: 'node-1',
          target: 'node-2',
          relationship: 'includes',
          properties: {
            confidence: 0.9
          },
          type: 'custom'
        },
        {
          id: 'edge-2',
          source: 'node-1',
          target: 'node-3',
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
      let result;

      try {
        result = await entityExtractionService.processTextInput(inputText, nodes);
      } catch (error) {
        console.warn('AI extraction endpoint failed, falling back to client extraction.', error);
        const basicEntities = entityExtractionService.extractBasicEntities(inputText);
        const basicRelationships = entityExtractionService.extractRelationships(inputText);
        const nodesFromText = entityExtractionService.createNodesFromEntities(basicEntities.concepts, nodes);
        const edgesFromText = entityExtractionService.createEdgesFromRelationships(basicRelationships, nodesFromText);
        result = {
          nodes: nodesFromText,
          edges: edgesFromText,
          entities: basicEntities,
          confidence: entityExtractionService.calculateOverallConfidence(nodesFromText, edgesFromText)
        };
      }

      // Add new nodes and edges to the graph
      result.nodes.forEach(node => addNode(node));
      result.edges.forEach(edge => addEdge(edge));

      setInputText('');

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

  const handlePathSelect = (path) => {
    const pathNodeIds = Array.from(new Set(
      path?.segments?.flatMap(segment => [segment.start?.id, segment.end?.id]).filter(Boolean) || []
    ));
    setSelectedElements(pathNodeIds, []);
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
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Left panel for model text input and instructions */}
      <aside style={{
        width: '360px',
        minWidth: '320px',
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        padding: '24px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>AI Text Extraction</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Paste a document, technical note, or prompt to create a connected graph.</div>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            title="How it works"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: 'none',
              background: '#e5e7eb',
              color: '#111827',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            ?
          </button>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your model text here. The AI will extract entities, concepts, and relationships into the graph view to the right."
          style={{
            width: '100%',
            minHeight: '240px',
            padding: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '14px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            background: '#f9fafb'
          }}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={handleTextProcessing}
            disabled={!inputText.trim() || isProcessing}
            style={{
              flex: 1,
              minWidth: '130px',
              background: inputText.trim() && !isProcessing ? '#10b981' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 16px',
              cursor: inputText.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              fontWeight: 600
            }}
          >
            {isProcessing ? 'Processing...' : 'Extract Graph'}
          </button>
          <button
            onClick={() => setInputText('')}
            disabled={!inputText.trim()}
            style={{
              flex: 1,
              minWidth: '130px',
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '12px 16px',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Clear Text
          </button>
        </div>

        {inputText.trim() && (
          <div style={{ marginTop: '14px', fontSize: '13px', color: '#6b7280' }}>
            Character count: {inputText.length} · Estimated nodes: ~{Math.max(1, Math.floor(inputText.split(/\s+/).length / 10))}
          </div>
        )}

        <div style={{ marginTop: '24px', padding: '18px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>How extraction works</div>
          <ul style={{ paddingLeft: '18px', color: '#4b5563', fontSize: '13px', lineHeight: 1.75 }}>
            <li>Detects entity names and technical concepts.</li>
            <li>Creates nodes for each concept.</li>
            <li>Links related terms using extracted relationships.</li>
            <li>Shows the resulting graph in the right panel.</li>
          </ul>
        </div>

        <button
          onClick={loadSampleGraph}
          style={{
            marginTop: '20px',
            width: '100%',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 16px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Load Example Graph
        </button>
      </aside>

      <main style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        <GraphCanvas graphId={currentGraphId} />

        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 20 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPathSearch(true)}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              width: '46px',
              height: '46px',
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(59, 130, 246, 0.22)'
            }}
            title="Search Paths"
          >
            <Search size={20} />
          </motion.button>
        </div>

        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 20 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const selectedNode = nodes[0];
              if (selectedNode) handleNodeExpansion(selectedNode.id);
            }}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              width: '46px',
              height: '46px',
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(139, 92, 246, 0.22)'
            }}
            title="Expand a node"
          >
            <GitBranch size={20} />
          </motion.button>
        </div>

        <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.9)', borderRadius: '14px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', zIndex: 20, fontSize: '13px', color: '#111827' }}>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>Graph overview</div>
          <div>Nodes: {nodes.length}</div>
          <div>Edges: {edges.length}</div>
        </div>
      </main>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50
            }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: 'min(560px, 90%)',
                background: 'white',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>How this site works</div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Paste text and let AI generate a visual knowledge graph.</div>
                </div>
                <button onClick={() => setShowHelp(false)} style={{ border: 'none', background: 'transparent', color: '#374151', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>
              <ul style={{ paddingLeft: '18px', color: '#374151', fontSize: '14px', lineHeight: 1.8 }}>
                <li>Enter any text or technical content into the left panel.</li>
                <li>The AI extracts entities, concepts, and relationships.</li>
                <li>Each extracted entity becomes a node in the graph.</li>
                <li>Relationships are added as edges connecting related nodes.</li>
                <li>You can pan, zoom, drag nodes, search paths and export the graph.</li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
