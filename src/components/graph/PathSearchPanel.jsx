import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Route, X, ArrowRight, Clock, Filter } from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import graphService from '../../services/api/graphService';

const PathSearchPanel = ({ onClose, onPathSelect }) => {
  const [startNode, setStartNode] = useState('');
  const [endNode, setEndNode] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [pathOptions, setPathOptions] = useState({
    maxDepth: 5,
    algorithm: 'shortest',
    includeWeights: false
  });

  const { nodes } = useGraphStore();

  useEffect(() => {
    if (startNode && endNode) {
      searchPaths();
    }
  }, [startNode, endNode, pathOptions]);

  const searchPaths = async () => {
    if (!startNode || !endNode) return;

    setIsSearching(true);
    try {
      const startNodeObj = nodes.find(n => n.data.label.toLowerCase() === startNode.toLowerCase());
      const endNodeObj = nodes.find(n => n.data.label.toLowerCase() === endNode.toLowerCase());

      if (!startNodeObj || !endNodeObj) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      let paths = [];
      
      switch (pathOptions.algorithm) {
        case 'shortest':
          const pathData = await graphService.findPath(startNodeObj.id, endNodeObj.id);
          if (pathData.path) {
            paths = [pathData.path];
          }
          break;
        
        case 'all':
          paths = await graphService.findAllPaths(startNodeObj.id, endNodeObj.id, pathOptions.maxDepth);
          break;
        
        case 'weighted':
          // For weighted paths, we'd need to implement weighted shortest path
          const weightedPath = await graphService.findPath(startNodeObj.id, endNodeObj.id);
          if (weightedPath.path) {
            paths = [weightedPath.path];
          }
          break;
      }

      setSearchResults(paths);
    } catch (error) {
      console.error('Error searching paths:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNodeSelect = (nodeType, nodeLabel) => {
    if (nodeType === 'start') {
      setStartNode(nodeLabel);
    } else {
      setEndNode(nodeLabel);
    }
  };

  const handlePathClick = (path, index) => {
    setSelectedPath(index);
    if (onPathSelect) {
      onPathSelect(path);
    }
  };

  const formatPath = (path) => {
    if (!path || !path.segments) return [];

    const nodeSequence = [];
    path.segments.forEach(segment => {
      if (!nodeSequence.includes(segment.start.id)) {
        nodeSequence.push(segment.start);
      }
      if (!nodeSequence.includes(segment.end.id)) {
        nodeSequence.push(segment.end);
      }
    });

    return nodeSequence;
  };

  const calculatePathMetrics = (path) => {
    if (!path || !path.segments) {
      return { length: 0, weight: 0, duration: 0 };
    }

    const length = path.segments.length;
    const weight = path.segments.reduce((sum, seg) => 
      sum + (seg.relationship?.weight || 1), 0
    );
    
    return { length, weight };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        minWidth: '500px',
        maxWidth: '700px',
        maxHeight: '600px',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Route size={20} color="#3b82f6" />
          <h2 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Path Search
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          <X size={16} color="#6b7280" />
        </button>
      </div>

      {/* Search Form */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              From Node
            </label>
            <input
              type="text"
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
              placeholder="Enter start node..."
              list="start-nodes"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <datalist id="start-nodes">
              {nodes.map(node => (
                <option key={node.id} value={node.data.label} />
              ))}
            </datalist>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              To Node
            </label>
            <input
              type="text"
              value={endNode}
              onChange={(e) => setEndNode(e.target.value)}
              placeholder="Enter end node..."
              list="end-nodes"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <datalist id="end-nodes">
              {nodes.map(node => (
                <option key={node.id} value={node.data.label} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Path Options */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="#6b7280" />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Algorithm:</span>
            <select
              value={pathOptions.algorithm}
              onChange={(e) => setPathOptions(prev => ({ ...prev, algorithm: e.target.value }))}
              style={{
                padding: '4px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="shortest">Shortest Path</option>
              <option value="all">All Paths</option>
              <option value="weighted">Weighted Path</option>
            </select>
          </div>

          {pathOptions.algorithm === 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Max Depth:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={pathOptions.maxDepth}
                onChange={(e) => setPathOptions(prev => ({ ...prev, maxDepth: parseInt(e.target.value) }))}
                style={{
                  width: '60px',
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {isSearching ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Searching paths...
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            {searchResults.map((path, index) => {
              const nodeSequence = formatPath(path);
              const metrics = calculatePathMetrics(path);
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handlePathClick(path, index)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: selectedPath === index ? '#f0f9ff' : 'transparent'
                  }}
                  whileHover={{ background: '#f9fafb' }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '4px'
                      }}>
                        Path {index + 1}
                      </div>
                      
                      {/* Node Sequence */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '8px'
                      }}>
                        {nodeSequence.map((node, nodeIndex) => (
                          <>
                            <span
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              {node.label}
                            </span>
                            {nodeIndex < nodeSequence.length - 1 && (
                              <ArrowRight size={12} color="#6b7280" />
                            )}
                          </>
                        ))}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Route size={10} />
                        Length: {metrics.length}
                      </div>
                      {metrics.weight > 0 && (
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280'
                        }}>
                          Weight: {metrics.weight}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Path Details */}
                  {path.segments && path.segments.length > 0 && (
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      background: '#f9fafb',
                      padding: '8px',
                      borderRadius: '4px'
                    }}>
                      {path.segments.map((segment, segIndex) => (
                        <div key={segIndex} style={{ marginBottom: segIndex < path.segments.length - 1 ? '4px' : '0' }}>
                          <span style={{ fontWeight: '500' }}>{segment.start.label}</span>
                          {' → '}
                          <span style={{ color: '#3b82f6' }}>{segment.relationship}</span>
                          {' → '}
                          <span style={{ fontWeight: '500' }}>{segment.end.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : startNode && endNode ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            No path found between "{startNode}" and "{endNode}"
          </div>
        ) : (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Enter start and end nodes to search for paths
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PathSearchPanel;
