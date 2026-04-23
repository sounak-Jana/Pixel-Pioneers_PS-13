import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, GitBranch, Search, Upload, FileText, Users } from 'lucide-react';

// Simple pixel grid background
function PixelGrid() {
  const cols = 28;
  const rows = 10;

  const pixels = Array.from({ length: cols * rows }, (_, i) => ({
    id: i,
    shade: Math.random() > 0.4,
    delay: Math.random() * 1.77,
    color: ["#00C896", "#00A87A", "#006B4F", "#B8F5E0", "#00E8A8"][Math.floor(Math.random() * 5)],
  }));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        opacity: 0.15,
        pointerEvents: "none",
      }}
    >
      {pixels.map((pixel) => (
        <div
          key={pixel.id}
          style={{
            background: pixel.shade ? pixel.color : "transparent",
            margin: "1px",
            animation: `pixelBlink ${1.5 + pixel.delay}s ease-in-out infinite`,
            animationDelay: `${pixel.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // Sample data
  const sampleNodes = [
    { id: '1', type: 'default', position: { x: 250, y: 100 }, data: { label: 'Machine Learning' } },
    { id: '2', type: 'default', position: { x: 100, y: 250 }, data: { label: 'Neural Networks' } },
    { id: '3', type: 'default', position: { x: 400, y: 250 }, data: { label: 'Deep Learning' } }
  ];

  const sampleEdges = [
    { id: 'e1-2', source: '1', target: '2', type: 'default' },
    { id: 'e1-3', source: '1', target: '3', type: 'default' }
  ];

  useEffect(() => {
    if (!showLanding) {
      setNodes(sampleNodes);
      setEdges(sampleEdges);
    }
  }, [showLanding]);

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
            Synapse
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
            Knowledge Graph Engine
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
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
          🧠 Synapse - Knowledge Graph Engine
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
          Interactive collaborative learning environment
        </p>
      </div>

      {/* Graph Canvas Area */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 80px)',
        background: 'white'
      }}>
        {/* Simple SVG Graph Visualization */}
        <svg style={{ width: '100%', height: '100%' }}>
          {/* Render edges */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <line
                key={edge.id}
                x1={sourceNode.position.x}
                y1={sourceNode.position.y}
                x2={targetNode.position.x}
                y2={targetNode.position.y}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          })}

          {/* Render nodes */}
          {nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.position.x}
                cy={node.position.y}
                r="30"
                fill={selectedNode === node.id ? "#3b82f6" : "#10b981"}
                stroke="white"
                strokeWidth="3"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
              />
              <text
                x={node.position.x}
                y={node.position.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="12px"
                fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {node.data.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Floating Action Buttons */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
          title="Add Node"
        >
          <Brain size={20} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
          title="Expand Node"
        >
          <GitBranch size={20} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
          title="Search"
        >
          <Search size={20} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
          title="Export"
        >
          <Upload size={20} />
        </motion.button>
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
        {selectedNode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={12} />
            Selected: {nodes.find(n => n.id === selectedNode)?.data.label}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pixelBlink {
          0%,100% { opacity:.3; transform:scale(.85); }
          50% { opacity:1; transform:scale(1); }
        }
      `}</style>
    </div>
  );
}

export default App;
