import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Brain, 
  BookOpen, 
  Lightbulb, 
  HelpCircle, 
  MessageSquare,
  Tag,
  User,
  Calendar,
  Target,
  Link
} from 'lucide-react';

const nodeTypeConfig = {
  concept: { color: '#3b82f6', icon: Brain, label: 'Concept' },
  definition: { color: '#10b981', icon: BookOpen, label: 'Definition' },
  example: { color: '#f59e0b', icon: Lightbulb, label: 'Example' },
  question: { color: '#ef4444', icon: HelpCircle, label: 'Question' },
  answer: { color: '#8b5cf6', icon: MessageSquare, label: 'Answer' },
  category: { color: '#ec4899', icon: Tag, label: 'Category' },
  person: { color: '#14b8a6', icon: User, label: 'Person' },
  event: { color: '#f97316', icon: Calendar, label: 'Event' },
  theory: { color: '#6366f1', icon: Target, label: 'Theory' },
  principle: { color: '#84cc16', icon: Link, label: 'Principle' },
  application: { color: '#06b6d4', icon: Target, label: 'Application' },
  resource: { color: '#a855f7', icon: BookOpen, label: 'Resource' }
};

const CustomNode = memo(({ id, data, selected }) => {
  const config = nodeTypeConfig[data.type] || nodeTypeConfig.concept;
  const Icon = config.icon;

  const handleNodeClick = (event) => {
    event.stopPropagation();
    if (data.onClick) {
      data.onClick(id);
    }
  };

  const handleNodeDoubleClick = (event) => {
    event.stopPropagation();
    if (data.onDoubleClick) {
      data.onDoubleClick(id);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`custom-node ${selected ? 'selected' : ''}`}
      style={{
        background: 'white',
        border: `2px solid ${config.color}`,
        borderRadius: '12px',
        padding: '12px',
        minWidth: '150px',
        maxWidth: '250px',
        boxShadow: selected 
          ? `0 0 0 3px ${config.color}40, 0 4px 12px rgba(0,0,0,0.15)`
          : '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
      onClick={handleNodeClick}
      onDoubleClick={handleNodeDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: config.color,
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: config.color,
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />

      {/* Node Header */}
      <div className="node-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          style={{
            background: config.color,
            borderRadius: '6px',
            padding: '4px',
            marginRight: '8px'
          }}
        >
          <Icon size={16} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div 
            style={{ 
              fontSize: '10px', 
              fontWeight: '600', 
              color: config.color,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {config.label}
          </div>
        </div>
      </div>

      {/* Node Content */}
      <div className="node-content">
        <h3 
          style={{ 
            margin: '0 0 4px 0', 
            fontSize: '14px', 
            fontWeight: '600',
            color: '#1f2937',
            lineHeight: '1.3'
          }}
        >
          {data.label}
        </h3>
        
        {data.properties?.description && (
          <p 
            style={{ 
              margin: '0', 
              fontSize: '12px', 
              color: '#6b7280',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {data.properties.description}
          </p>
        )}
      </div>

      {/* Node Footer */}
      {(data.properties?.tags || data.properties?.source) && (
        <div 
          style={{ 
            marginTop: '8px', 
            paddingTop: '8px', 
            borderTop: '1px solid #e5e7eb',
            fontSize: '10px',
            color: '#9ca3af'
          }}
        >
          {data.properties?.tags && (
            <div style={{ marginBottom: '4px' }}>
              {Array.isArray(data.properties.tags) 
                ? data.properties.tags.slice(0, 2).map((tag, i) => (
                    <span 
                      key={i}
                      style={{
                        background: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginRight: '4px',
                        fontSize: '9px'
                      }}
                    >
                      {tag}
                    </span>
                  ))
                : data.properties.tags
              }
            </div>
          )}
          
          {data.properties?.source && (
            <div style={{ fontStyle: 'italic' }}>
              Source: {data.properties.source}
            </div>
          )}
        </div>
      )}

      {/* Connection Indicators */}
      <div 
        style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: data.properties?.hasConnections ? config.color : '#e5e7eb',
          border: '2px solid white'
        }}
      />

      {/* Collaboration Indicator */}
      {data.properties?.collaborators && data.properties.collaborators.length > 0 && (
        <div 
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '-4px',
            display: 'flex',
            gap: '-4px'
          }}
        >
          {data.properties.collaborators.slice(0, 3).map((collaborator, i) => (
            <div
              key={i}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: collaborator.color || '#6b7280',
                border: '2px solid white',
                marginLeft: i > 0 ? '-8px' : '0'
              }}
              title={collaborator.name}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
