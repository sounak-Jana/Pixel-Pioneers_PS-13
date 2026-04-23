import axios from 'axios';
import { useGraphStore } from '../../stores/graphStore.js';

class ConflictResolutionService {
  constructor() {
    this.apiBase = 'http://localhost:3001/api/ai';
    this.conflictTypes = {
      DUPLICATE_NODE: 'duplicate_node',
      CONTRADICTORY_RELATIONSHIP: 'contradictory_relationship',
      DEFINITION_CONFLICT: 'definition_conflict',
      TYPE_MISMATCH: 'type_mismatch',
      RELATIONSHIP_CONFLICT: 'relationship_conflict'
    };
  }

  // Detect conflicts in the graph
  detectConflicts(nodes, edges) {
    const conflicts = [];

    // Check for duplicate nodes
    const duplicateNodes = this.findDuplicateNodes(nodes);
    conflicts.push(...duplicateNodes);

    // Check for contradictory relationships
    const contradictoryRelationships = this.findContradictoryRelationships(edges);
    conflicts.push(...contradictoryRelationships);

    // Check for definition conflicts
    const definitionConflicts = this.findDefinitionConflicts(nodes);
    conflicts.push(...definitionConflicts);

    // Check for type mismatches
    const typeMismatches = this.findTypeMismatches(edges, nodes);
    conflicts.push(...typeMismatches);

    return conflicts;
  }

  findDuplicateNodes(nodes) {
    const duplicates = [];
    const nodeMap = new Map();

    nodes.forEach(node => {
      const key = node.data.label.toLowerCase().trim();
      if (nodeMap.has(key)) {
        const existingNode = nodeMap.get(key);
        duplicates.push({
          type: this.conflictTypes.DUPLICATE_NODE,
          severity: 'medium',
          description: `Duplicate nodes found: "${node.data.label}"`,
          entities: [existingNode, node],
          suggestedResolution: 'merge',
          confidence: 0.9
        });
      } else {
        nodeMap.set(key, node);
      }
    });

    return duplicates;
  }

  findContradictoryRelationships(edges) {
    const contradictions = [];
    const relationshipMap = new Map();

    edges.forEach(edge => {
      const key = `${edge.from}-${edge.to}`;
      const reverseKey = `${edge.to}-${edge.from}`;

      // Check for opposite relationships
      if (relationshipMap.has(reverseKey)) {
        const existingEdge = relationshipMap.get(reverseKey);
        const isContradictory = this.areRelationshipsContradictory(
          existingEdge.data.relationship, 
          edge.data.relationship
        );

        if (isContradictory) {
          contradictions.push({
            type: this.conflictTypes.CONTRADICTORY_RELATIONSHIP,
            severity: 'high',
            description: `Contradictory relationships between nodes`,
            entities: [existingEdge, edge],
            suggestedResolution: 'clarify',
            confidence: 0.8
          });
        }
      }

      relationshipMap.set(key, edge);
    });

    return contradictions;
  }

  findDefinitionConflicts(nodes) {
    const conflicts = [];
    const definitionMap = new Map();

    nodes
      .filter(node => node.data.type === 'definition' || node.data.properties?.definition)
      .forEach(node => {
        const key = node.data.label.toLowerCase().trim();
        
        if (definitionMap.has(key)) {
          const existingNode = definitionMap.get(key);
          const similarity = this.calculateTextSimilarity(
            existingNode.data.properties?.definition || '',
            node.data.properties?.definition || ''
          );

          if (similarity < 0.5) { // Low similarity indicates conflict
            conflicts.push({
              type: this.conflictTypes.DEFINITION_CONFLICT,
              severity: 'medium',
              description: `Conflicting definitions for "${node.data.label}"`,
              entities: [existingNode, node],
              suggestedResolution: 'merge_or_branch',
              confidence: 0.7,
              similarity
            });
          }
        } else {
          definitionMap.set(key, node);
        }
      });

    return conflicts;
  }

  findTypeMismatches(edges, nodes) {
    const conflicts = [];
    const nodeTypeMap = new Map();

    nodes.forEach(node => {
      nodeTypeMap.set(node.id, node.data.type);
    });

    edges.forEach(edge => {
      const fromType = nodeTypeMap.get(edge.from);
      const toType = nodeTypeMap.get(edge.to);

      if (this.isInvalidRelationshipType(fromType, toType, edge.data.relationship)) {
        conflicts.push({
          type: this.conflictTypes.TYPE_MISMATCH,
          severity: 'low',
          description: `Invalid relationship type between ${fromType} and ${toType}`,
          entities: [edge],
          suggestedResolution: 'correct_type',
          confidence: 0.6
        });
      }
    });

    return conflicts;
  }

  areRelationshipsContradictory(rel1, rel2) {
    const contradictions = [
      ['supports', 'contradicts'],
      ['enables', 'prevents'],
      ['causes', 'prevents'],
      ['requires', 'excludes'],
      ['includes', 'excludes']
    ];

    return contradictions.some(pair => 
      (pair.includes(rel1) && pair.includes(rel2)) && rel1 !== rel2
    );
  }

  isInvalidRelationshipType(fromType, toType, relationship) {
    const invalidCombinations = {
      'definition': ['questions', 'answers'],
      'question': ['questions'],
      'answer': ['answers'],
      'example': ['example_of']
    };

    return invalidCombinations[fromType]?.includes(relationship) ||
           invalidCombinations[toType]?.includes(relationship);
  }

  calculateTextSimilarity(text1, text2) {
    // Simple text similarity using Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  // Resolve conflicts using AI
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

  // Apply conflict resolution
  async applyResolution(conflict, resolution, nodes, edges) {
    switch (resolution.action) {
      case 'merge':
        return this.mergeEntities(conflict.entities, nodes, edges);
      
      case 'branch':
        return this.createBranch(conflict.entities, nodes, edges);
      
      case 'clarify':
        return this.requestClarification(conflict, nodes, edges);
      
      case 'correct_type':
        return this.correctNodeType(conflict.entities, nodes, edges);
      
      default:
        return { nodes, edges, resolved: false };
    }
  }

  mergeEntities(entities, nodes, edges) {
    const [entity1, entity2] = entities;
    
    if (entity1.data && entity2.data) {
      // Merge nodes
      const mergedNode = {
        ...entity1,
        id: entity1.id, // Keep the first node's ID
        data: {
          ...entity1.data,
          properties: {
            ...entity1.data.properties,
            ...entity2.data.properties,
            mergedFrom: [entity1.id, entity2.id],
            mergedAt: new Date().toISOString()
          }
        }
      };

      // Remove the second node and update edges
      const updatedNodes = nodes.filter(n => n.id !== entity2.id);
      const updatedEdges = edges.map(edge => {
        if (edge.from === entity2.id) return { ...edge, from: entity1.id };
        if (edge.to === entity2.id) return { ...edge, to: entity1.id };
        return edge;
      });

      return {
        nodes: [mergedNode, ...updatedNodes],
        edges: updatedEdges,
        resolved: true
      };
    }

    return { nodes, edges, resolved: false };
  }

  createBranch(entities, nodes, edges) {
    // Create branched versions for conflicting entities
    const branchedEntities = entities.map((entity, index) => ({
      ...entity,
      id: `${entity.id}-branch-${index}`,
      data: {
        ...entity.data,
        label: `${entity.data.label} (Branch ${index + 1})`,
        properties: {
          ...entity.data.properties,
          branchedFrom: entity.id,
          branchedAt: new Date().toISOString()
        }
      }
    }));

    const updatedNodes = [
      ...nodes.filter(n => !entities.find(e => e.id === n.id)),
      ...branchedEntities
    ];

    return {
      nodes: updatedNodes,
      edges,
      resolved: true
    };
  }

  requestClarification(conflict, nodes, edges) {
    // Add clarification request to the graph
    const clarificationNode = {
      id: `clarification-${Date.now()}`,
      type: 'custom',
      position: {
        x: 400,
        y: 300
      },
      data: {
        label: 'Clarification Needed',
        type: 'question',
        properties: {
          description: `Conflict detected: ${conflict.description}`,
          conflictType: conflict.type,
          conflictEntities: conflict.entities.map(e => e.id),
          createdAt: new Date().toISOString()
        }
      }
    };

    return {
      nodes: [...nodes, clarificationNode],
      edges,
      resolved: false
    };
  }

  correctNodeType(entities, nodes, edges) {
    const [edge] = entities;
    
    // Suggest correct relationship type
    const correctedEdge = {
      ...edge,
      data: {
        ...edge.data,
        relationship: 'related_to', // Default to generic relationship
        properties: {
          ...edge.data.properties,
          correctedAt: new Date().toISOString(),
          originalRelationship: edge.data.relationship
        }
      }
    };

    const updatedEdges = edges.map(e => 
      e.id === edge.id ? correctedEdge : e
    );

    return {
      nodes,
      edges: updatedEdges,
      resolved: true
    };
  }

  // Auto-resolve low-confidence conflicts
  autoResolveConflicts(conflicts) {
    const autoResolved = [];
    const remaining = [];

    conflicts.forEach(conflict => {
      if (conflict.confidence > 0.8 && conflict.severity === 'low') {
        // Auto-resolve high-confidence, low-severity conflicts
        const resolution = this.getAutoResolution(conflict);
        autoResolved.push({ conflict, resolution });
      } else {
        remaining.push(conflict);
      }
    });

    return { autoResolved, remaining };
  }

  getAutoResolution(conflict) {
    switch (conflict.type) {
      case this.conflictTypes.DUPLICATE_NODE:
        return { action: 'merge', confidence: 0.9 };
      
      case this.conflictTypes.TYPE_MISMATCH:
        return { action: 'correct_type', confidence: 0.8 };
      
      default:
        return { action: 'manual_review', confidence: 0.5 };
    }
  }
}

export const conflictResolutionService = new ConflictResolutionService();
export default conflictResolutionService;
