import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';

const SearchPanel = ({ query, onQueryChange, onClose }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { nodes, edges, setSelectedElements } = useGraphStore();

  useEffect(() => {
    if (query.trim()) {
      performSearch(query);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    setIsSearching(true);
    
    try {
      // Search in nodes
      const nodeResults = nodes.filter(node => 
        node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.properties?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.properties?.tags?.some(tag => 
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ).map(node => ({
        type: 'node',
        id: node.id,
        label: node.data.label,
        description: node.data.properties?.description || '',
        nodeType: node.data.type,
        relevance: calculateRelevance(node.data, searchQuery)
      }));

      // Search in edges
      const edgeResults = edges.filter(edge =>
        edge.data.relationship.toLowerCase().includes(searchQuery.toLowerCase()) ||
        edge.data.properties?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(edge => ({
        type: 'edge',
        id: edge.id,
        label: edge.data.relationship,
        description: edge.data.properties?.description || '',
        fromNode: nodes.find(n => n.id === edge.from)?.data?.label || '',
        toNode: nodes.find(n => n.id === edge.to)?.data?.label || '',
        relevance: calculateEdgeRelevance(edge.data, searchQuery)
      }));

      // Combine and sort by relevance
      const allResults = [...nodeResults, ...edgeResults]
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 10);

      setSearchResults(allResults);
      
      // Update recent searches
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const calculateRelevance = (nodeData, searchQuery) => {
    const query = searchQuery.toLowerCase();
    const label = nodeData.label.toLowerCase();
    const description = (nodeData.properties?.description || '').toLowerCase();
    const tags = (nodeData.properties?.tags || []).join(' ').toLowerCase();

    let relevance = 0;
    
    // Exact label match gets highest score
    if (label === query) relevance += 100;
    else if (label.includes(query)) relevance += 80;
    
    // Description matches
    if (description.includes(query)) relevance += 40;
    
    // Tag matches
    if (tags.includes(query)) relevance += 30;
    
    // Partial matches
    if (label.includes(query.split(' ')[0])) relevance += 20;
    
    return relevance;
  };

  const calculateEdgeRelevance = (edgeData, searchQuery) => {
    const query = searchQuery.toLowerCase();
    const relationship = edgeData.relationship.toLowerCase();
    const description = (edgeData.properties?.description || '').toLowerCase();

    let relevance = 0;
    
    if (relationship === query) relevance += 100;
    else if (relationship.includes(query)) relevance += 80;
    
    if (description.includes(query)) relevance += 40;
    
    return relevance;
  };

  const handleResultClick = (result) => {
    if (result.type === 'node') {
      setSelectedElements([result.id], []);
      // Center the view on the node
      // This would need to be implemented in the parent component
    } else if (result.type === 'edge') {
      setSelectedElements([], [result.id]);
    }
    onClose();
  };

  const handleRecentSearchClick = (searchTerm) => {
    onQueryChange(searchTerm);
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
        minWidth: '400px',
        maxWidth: '600px',
        maxHeight: '500px',
        overflow: 'hidden'
      }}
    >
      {/* Search Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Search size={20} color="#6b7280" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search nodes and relationships..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}
          autoFocus
        />
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={16} color="#6b7280" />
        </button>
      </div>

      {/* Search Results */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {isSearching ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Searching...
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            {searchResults.map((result, index) => (
              <motion.div
                key={`${result.type}-${result.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleResultClick(result)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                whileHover={{ background: '#f9fafb' }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: result.type === 'node' ? '#3b82f6' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {result.type === 'node' ? 'N' : 'E'}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '2px'
                  }}>
                    {result.label}
                  </div>
                  
                  {result.description && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {result.description}
                    </div>
                  )}
                  
                  <div style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      background: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'capitalize'
                    }}>
                      {result.type}
                    </span>
                    
                    {result.nodeType && (
                      <span style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'capitalize'
                      }}>
                        {result.nodeType}
                      </span>
                    )}
                    
                    {result.relevance > 50 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <TrendingUp size={10} />
                        <span>High relevance</span>
                      </div>
                    )}
                  </div>
                  
                  {result.type === 'edge' && (result.fromNode || result.toNode) && (
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginTop: '4px'
                    }}>
                      {result.fromNode} → {result.toNode}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : query.trim() ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            No results found for "{query}"
          </div>
        ) : recentSearches.length > 0 ? (
          <div>
            <div style={{
              padding: '12px 16px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Clock size={12} />
              Recent searches
            </div>
            {recentSearches.map((search, index) => (
              <div
                key={index}
                onClick={() => handleRecentSearchClick(search)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                  borderBottom: '1px solid #f3f4f6'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                {search}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Start typing to search...
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchPanel;
