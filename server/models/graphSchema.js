import { getSession } from '../config/database.js';

export const initializeSchema = async () => {
  const session = getSession();
  
  try {
    // Create constraints for unique identifiers
    await session.run(`
      CREATE CONSTRAINT node_id_unique IF NOT EXISTS
      FOR (n:Node) REQUIRE n.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT relationship_id_unique IF NOT EXISTS
      FOR ()-[r:RELATIONSHIP]-() REQUIRE r.id IS UNIQUE
    `);
    
    // Create indexes for performance
    await session.run(`
      CREATE INDEX node_label_index IF NOT EXISTS
      FOR (n:Node) ON (n.label)
    `);
    
    await session.run(`
      CREATE INDEX node_type_index IF NOT EXISTS
      FOR (n:Node) ON (n.type)
    `);
    
    await session.run(`
      CREATE INDEX relationship_type_index IF NOT EXISTS
      FOR ()-[r:RELATIONSHIP]-() ON (r.relationship)
    `);
    
    await session.run(`
      CREATE INDEX node_created_at_index IF NOT EXISTS
      FOR (n:Node) ON (n.createdAt)
    `);
    
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing schema:', error);
    throw error;
  } finally {
    await session.close();
  }
};

// Node types for the knowledge graph
export const NODE_TYPES = {
  CONCEPT: 'concept',
  DEFINITION: 'definition',
  EXAMPLE: 'example',
  QUESTION: 'question',
  ANSWER: 'answer',
  CATEGORY: 'category',
  PERSON: 'person',
  EVENT: 'event',
  THEORY: 'theory',
  PRINCIPLE: 'principle',
  APPLICATION: 'application',
  RESOURCE: 'resource'
};

// Relationship types
export const RELATIONSHIP_TYPES = {
  DEFINES: 'defines',
  EXAMPLE_OF: 'example_of',
  RELATED_TO: 'related_to',
  PART_OF: 'part_of',
  CONTAINS: 'contains',
  QUESTIONS: 'questions',
  ANSWERS: 'answers',
  CATEGORIZED_AS: 'categorized_as',
  CREATED_BY: 'created_by',
  BUILDS_ON: 'builds_on',
  CONTRADICTS: 'contradicts',
  SUPPORTS: 'supports',
  APPLIES_TO: 'applies_to',
  REFERENCES: 'references'
};

// Helper function to validate node structure
export const validateNode = (node) => {
  const required = ['id', 'label', 'type'];
  const missing = required.filter(field => !node[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (!Object.values(NODE_TYPES).includes(node.type)) {
    throw new Error(`Invalid node type: ${node.type}`);
  }
  
  return true;
};

// Helper function to validate relationship structure
export const validateRelationship = (relationship) => {
  const required = ['id', 'fromNode', 'toNode', 'relationship'];
  const missing = required.filter(field => !relationship[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (!Object.values(RELATIONSHIP_TYPES).includes(relationship.relationship)) {
    throw new Error(`Invalid relationship type: ${relationship.relationship}`);
  }
  
  return true;
};
