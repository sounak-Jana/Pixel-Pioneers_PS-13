import React from 'react';
import { motion } from 'framer-motion';
import { Cursor } from 'lucide-react';

const UserCursors = ({ cursors }) => {
  if (!cursors || Object.keys(cursors).length === 0) {
    return null;
  }

  const userColors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  const getUserColor = (userId) => {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return userColors[hash % userColors.length];
  };

  return (
    <div className="user-cursors">
      {Object.entries(cursors).map(([userId, cursor]) => {
        const color = getUserColor(userId);
        
        return (
          <motion.div
            key={userId}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'absolute',
              left: cursor.x,
              top: cursor.y,
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            <motion.div
              animate={{ 
                x: [0, 2, 0], 
                y: [0, 1, 0] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Cursor 
                size={16} 
                color={color}
                style={{
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                }}
              />
              <div
                style={{
                  background: color,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                {cursor.userName || `User ${userId.slice(-4)}`}
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default UserCursors;
