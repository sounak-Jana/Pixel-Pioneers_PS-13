import React, { memo } from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath,
  getMarkerEnd
} from 'reactflow';
import { motion } from 'framer-motion';
import { ArrowRight, Link2, GitBranch, MessageSquare } from 'lucide-react';

const edgeTypeConfig = {
  defines: { color: '#10b981', icon: ArrowRight, label: 'defines' },
  example_of: { color: '#f59e0b', icon: Lightbulb, label: 'example of' },
  related_to: { color: '#6b7280', icon: Link2, label: 'related to' },
  part_of: { color: '#3b82f6', icon: GitBranch, label: 'part of' },
  contains: { color: '#8b5cf6', icon: GitBranch, label: 'contains' },
  questions: { color: '#ef4444', icon: MessageSquare, label: 'questions' },
  answers: { color: '#10b981', icon: MessageSquare, label: 'answers' },
  categorized_as: { color: '#ec4899', icon: Tag, label: 'categorized as' },
  created_by: { color: '#14b8a6', icon: User, label: 'created by' },
  builds_on: { color: '#f97316', icon: ArrowRight, label: 'builds on' },
  contradicts: { color: '#ef4444', icon: ArrowRight, label: 'contradicts' },
  supports: { color: '#10b981', icon: ArrowRight, label: 'supports' },
  applies_to: { color: '#06b6d4', icon: ArrowRight, label: 'applies to' },
  references: { color: '#6b7280', icon: Link2, label: 'references' }
};

const CustomEdge = memo(({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition, 
  data = {},
  selected,
  markerEnd 
}) => {
  const config = edgeTypeConfig[data.relationship] || edgeTypeConfig.related_to;
  const Icon = config.icon;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleEdgeClick = (event) => {
    event.stopPropagation();
    if (data.onClick) {
      data.onClick(id);
    }
  };

  const handleEdgeDoubleClick = (event) => {
    event.stopPropagation();
    if (data.onDoubleClick) {
      data.onDoubleClick(id);
    }
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={getMarkerEnd(markerEnd)}
        style={{
          stroke: config.color,
          strokeWidth: selected ? 3 : 2,
          filter: selected ? `drop-shadow(0 0 6px ${config.color}40)` : 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={handleEdgeClick}
        onDoubleClick={handleEdgeDoubleClick}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEdgeClick}
            onDoubleClick={handleEdgeDoubleClick}
            style={{
              background: 'white',
              border: `1px solid ${config.color}`,
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: '500',
              color: config.color,
              boxShadow: selected 
                ? `0 0 0 2px ${config.color}40, 0 2px 8px rgba(0,0,0,0.1)`
                : '0 1px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minWidth: '60px',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon size={10} />
            <span>{config.label}</span>
            
            {/* Confidence indicator if available */}
            {data.properties?.confidence && (
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: data.properties.confidence > 0.8 ? '#10b981' : 
                             data.properties.confidence > 0.5 ? '#f59e0b' : '#ef4444'
                }}
                title={`Confidence: ${Math.round(data.properties.confidence * 100)}%`}
              />
            )}
          </motion.div>
        </div>
      </EdgeLabelRenderer>

      {/* Animated pulse for newly created edges */}
      {data.isNew && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            position: 'absolute',
            left: (sourceX + targetX) / 2,
            top: (sourceY + targetY) / 2,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: `2px solid ${config.color}`,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}

      {/* Collaboration indicator */}
      {data.properties?.collaborators && data.properties.collaborators.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: (sourceX + targetX) / 2,
            top: (sourceY + targetY) / 2 - 20,
            display: 'flex',
            gap: '-4px',
            transform: 'translateX(-50%)'
          }}
        >
          {data.properties.collaborators.slice(0, 2).map((collaborator, i) => (
            <div
              key={i}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: collaborator.color || '#6b7280',
                border: '1px solid white',
                marginLeft: i > 0 ? '-6px' : '0'
              }}
              title={`${collaborator.name} contributed to this relationship`}
            />
          ))}
        </div>
      )}
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';

export default CustomEdge;
