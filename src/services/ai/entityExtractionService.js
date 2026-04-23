import axios from 'axios';

class EntityExtractionService {
  constructor() {
    this.apiBase = 'http://localhost:3002/api/ai';
  }

  async extractEntities(text) {
    try {
      const response = await axios.post(`${this.apiBase}/extract`, {
        text
      });
      return response.data;
    } catch (error) {
      console.error('Error extracting entities:', error);
      throw error;
    }
  }

  async resolveConflicts(conflicts) {
    try {
      const response = await axios.post(`${this.apiBase}/resolve-conflicts`, {
        conflicts
      });
      return response.data;
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      throw error;
    }
  }

  async suggestConnections(nodeId, context) {
    try {
      const response = await axios.post(`${this.apiBase}/suggest-connections`, {
        nodeId,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }

  async expandNode(nodeId) {
    try {
      const response = await axios.post(`${this.apiBase}/expand-node/${nodeId}`);
      return response.data;
    } catch (error) {
      console.error('Error expanding node:', error);
      throw error;
    }
  }

  // Client-side NLP processing using compromise
  extractBasicEntities(text) {
    const entities = {
      concepts: [],
      definitions: [],
      examples: [],
      questions: [],
      relationships: []
    };

    // Split text into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    sentences.forEach(sentence => {
      sentence = sentence.trim();
      if (!sentence) return;

      // Extract potential definitions (sentences with "is", "are", "means", etc.)
      if (/\b(is|are|means|refers to|defines)\b/i.test(sentence)) {
        const parts = sentence.split(/\b(is|are|means|refers to|defines)\b/i);
        if (parts.length >= 2) {
          entities.definitions.push({
            term: parts[0].trim(),
            definition: parts.slice(1).join(' ').trim(),
            confidence: 0.7
          });
        }
      }

      // Extract potential examples (sentences with "for example", "such as", etc.)
      if (/\b(for example|for instance|such as|like)\b/i.test(sentence)) {
        entities.examples.push({
          example: sentence,
          confidence: 0.6
        });
      }

      // Extract questions
      if (sentence.includes('?')) {
        entities.questions.push({
          question: sentence,
          confidence: 0.9
        });
      }

      // Extract potential concepts (nouns and noun phrases)
      const words = sentence.split(/\s+/);
      const potentialConcepts = words.filter(word => 
        word.length > 3 && 
        !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())
      );

      potentialConcepts.forEach(concept => {
        if (!entities.concepts.find(c => c.term.toLowerCase() === concept.toLowerCase())) {
          entities.concepts.push({
            term: concept,
            context: sentence,
            confidence: 0.5
          });
        }
      });
    });

    return entities;
  }

  // Extract relationships from text
  extractRelationships(text) {
    const relationships = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    const relationshipPatterns = [
      { pattern: /(\w+)\s+(is|are|was|were)\s+(a|an|the)?\s*(\w+)/gi, type: 'is_a' },
      { pattern: /(\w+)\s+(has|have|contains|includes)\s+(\w+)/gi, type: 'has' },
      { pattern: /(\w+)\s+(causes|leads to|results in)\s+(\w+)/gi, type: 'causes' },
      { pattern: /(\w+)\s+(requires|needs)\s+(\w+)/gi, type: 'requires' },
      { pattern: /(\w+)\s+(enables|allows)\s+(\w+)/gi, type: 'enables' }
    ];

    sentences.forEach(sentence => {
      relationshipPatterns.forEach(({ pattern, type }) => {
        const matches = [...sentence.matchAll(pattern)];
        matches.forEach(match => {
          relationships.push({
            from: match[1],
            to: match[3],
            relationship: type,
            context: sentence,
            confidence: 0.6
          });
        });
      });
    });

    return relationships;
  }

  // Process text input and create graph elements
  async processTextInput(text, existingNodes = []) {
    try {
      // Get basic entities from client-side processing
      const basicEntities = this.extractBasicEntities(text);
      const basicRelationships = this.extractRelationships(text);

      // Get AI-enhanced extraction
      const aiResults = await this.extractEntities(text);

      // Combine and deduplicate results
      const allConcepts = this.mergeEntities(basicEntities.concepts, aiResults.entities?.aiExtracted || []);
      const allRelationships = this.mergeRelationships(basicRelationships, aiResults.relationships || []);

      // Create graph elements
      const nodes = this.createNodesFromEntities(allConcepts, existingNodes);
      const edges = this.createEdgesFromRelationships(allRelationships, nodes);

      return {
        nodes,
        edges,
        entities: {
          concepts: allConcepts,
          definitions: [...basicEntities.definitions, ...(aiResults.entities?.definitions || [])],
          examples: [...basicEntities.examples, ...(aiResults.entities?.examples || [])],
          questions: [...basicEntities.questions, ...(aiResults.entities?.questions || [])]
        },
        confidence: this.calculateOverallConfidence(nodes, edges)
      };
    } catch (error) {
      console.error('Error processing text input:', error);
      throw error;
    }
  }

  mergeEntities(clientEntities, aiEntities) {
    const merged = [];
    const seen = new Set();

    // Add AI entities first (higher confidence)
    aiEntities.forEach(entity => {
      const key = entity.name?.toLowerCase() || entity.term?.toLowerCase();
      if (key && !seen.has(key)) {
        merged.push({
          term: entity.name || entity.term,
          type: entity.type || 'concept',
          definition: entity.definition,
          confidence: entity.confidence || 0.8,
          source: 'ai'
        });
        seen.add(key);
      }
    });

    // Add client entities if not already present
    clientEntities.forEach(entity => {
      const key = entity.term?.toLowerCase();
      if (key && !seen.has(key)) {
        merged.push({
          ...entity,
          source: 'client'
        });
        seen.add(key);
      }
    });

    return merged;
  }

  mergeRelationships(clientRelationships, aiRelationships) {
    const merged = [];
    const seen = new Set();

    // Add AI relationships first
    aiRelationships.forEach(rel => {
      const key = `${rel.from?.toLowerCase()}-${rel.to?.toLowerCase()}-${rel.type || rel.relationship}`;
      if (!seen.has(key)) {
        merged.push({
          from: rel.from,
          to: rel.to,
          relationship: rel.type || rel.relationship,
          confidence: rel.confidence || 0.8,
          source: 'ai'
        });
        seen.add(key);
      }
    });

    // Add client relationships if not already present
    clientRelationships.forEach(rel => {
      const key = `${rel.from?.toLowerCase()}-${rel.to?.toLowerCase()}-${rel.type || rel.relationship}`;
      if (!seen.has(key)) {
        merged.push({
          ...rel,
          source: 'client'
        });
        seen.add(key);
      }
    });

    return merged;
  }

  createNodesFromEntities(concepts, existingNodes) {
    return concepts.map((concept, index) => {
      const existingNode = existingNodes.find(node => 
        node.data.label.toLowerCase() === concept.term.toLowerCase()
      );

      if (existingNode) {
        // Update existing node
        return {
          ...existingNode,
          data: {
            ...existingNode.data,
            properties: {
              ...existingNode.data.properties,
              ...concept,
              updatedAt: new Date().toISOString()
            }
          }
        };
      }

      // Create new node
      return {
        id: `node-${Date.now()}-${index}`,
        type: 'custom',
        position: {
          x: 100 + Math.random() * 400,
          y: 100 + Math.random() * 300
        },
        data: {
          label: concept.term,
          type: concept.type || 'concept',
          properties: {
            ...concept,
            createdAt: new Date().toISOString()
          }
        }
      };
    });
  }

  createEdgesFromRelationships(relationships, nodes) {
    return relationships.map((rel, index) => {
      const fromNode = nodes.find(node => 
        node.data.label.toLowerCase() === rel.from.toLowerCase()
      );
      const toNode = nodes.find(node => 
        node.data.label.toLowerCase() === rel.to.toLowerCase()
      );

      if (!fromNode || !toNode) {
        return null; // Skip if nodes don't exist
      }

      return {
        id: `edge-${Date.now()}-${index}`,
        from: fromNode.id,
        to: toNode.id,
        relationship: rel.relationship,
        properties: {
          ...rel,
          createdAt: new Date().toISOString()
        },
        type: 'custom'
      };
    }).filter(Boolean); // Remove null entries
  }

  calculateOverallConfidence(nodes, edges) {
    const nodeConfidence = nodes.reduce((sum, node) => 
      sum + (node.data.properties.confidence || 0.5), 0
    ) / (nodes.length || 1);
    
    const edgeConfidence = edges.reduce((sum, edge) => 
      sum + (edge.properties.confidence || 0.5), 0
    ) / (edges.length || 1);

    return (nodeConfidence + edgeConfidence) / 2;
  }
}

export const entityExtractionService = new EntityExtractionService();
export default entityExtractionService;
