import nlp from 'compromise';
import { getSession } from '../config/database.js';

export const extractEntities = async (req, res) => {
  try {
    const { text } = req.body;
    
    // Use compromise for basic NLP extraction
    const doc = nlp(text);
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    const adjectives = doc.adjectives().out('array');
    
    // Use rule-based entity extraction with compromise
    const entities = extractEntitiesWithNLP(text, nouns, verbs, adjectives);
    const relationships = extractRelationshipsWithNLP(text, entities);
    
    // Combine NLP results
    const result = {
      nouns,
      verbs,
      adjectives,
      aiExtracted: entities
    };
    
    res.json({
      entities: result,
      relationships: relationships,
      rawText: text
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resolveConflicts = async (req, res) => {
  try {
    const { conflicts } = req.body;
    
    // Use rule-based conflict resolution
    const resolution = resolveConflictsWithRules(conflicts);
    res.json(resolution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const suggestConnections = async (req, res) => {
  try {
    const { nodeId, context } = req.body;
    const session = getSession();
    
    // Get existing connections
    const existingResult = await session.run(
      `MATCH (n:Node {id: $nodeId})-[r]-(connected:Node)
       RETURN connected.label as label, type(r) as relationshipType`,
      { nodeId }
    );
    
    const existingConnections = existingResult.records.map(record => ({
      label: record.get('label'),
      relationship: record.get('relationshipType')
    }));
    
    // Use rule-based connection suggestions
    const suggestions = suggestConnectionsWithRules(context.nodeLabel, existingConnections);
    await session.close();
    
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const expandNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const session = getSession();
    
    // Get node details
    const nodeResult = await session.run(
      `MATCH (n:Node {id: $nodeId}) RETURN n`,
      { nodeId }
    );
    
    if (nodeResult.records.length === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const node = nodeResult.records[0].get('n').properties;
    
    // Use rule-based node expansion
    const expansion = expandNodeWithRules(node.label, node.type, node.properties?.description || '');
    await session.close();
    
    res.json({
      originalNode: node,
      expansion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions for free rule-based alternatives
function extractEntitiesWithNLP(text, nouns, verbs, adjectives) {
  const entities = [];
  
  // Extract noun phrases as potential entities
  const doc = nlp(text);
  const nounPhrases = doc.nouns().out('array');
  
  nounPhrases.forEach((phrase, index) => {
    if (phrase.length > 2) { // Filter out very short phrases
      entities.push({
        name: phrase,
        type: determineEntityType(phrase, text),
        definition: extractDefinition(phrase, text)
      });
    }
  });
  
  // Add key concepts from verbs
  verbs.forEach(verb => {
    if (verb.length > 3) {
      entities.push({
        name: verb,
        type: 'action',
        definition: `Action or process: ${verb}`
      });
    }
  });
  
  return entities;
}

function extractRelationshipsWithNLP(text, entities) {
  const relationships = [];
  const doc = nlp(text);
  
  // Find relationship patterns
  const sentences = doc.sentences().out('array');
  
  sentences.forEach(sentence => {
    const sentDoc = nlp(sentence);
    const foundEntities = entities.filter(e => 
      sentence.toLowerCase().includes(e.name.toLowerCase())
    );
    
    // Create relationships between co-occurring entities
    for (let i = 0; i < foundEntities.length - 1; i++) {
      for (let j = i + 1; j < foundEntities.length; j++) {
        relationships.push({
          from: foundEntities[i].name,
          to: foundEntities[j].name,
          type: determineRelationshipType(sentence, foundEntities[i], foundEntities[j])
        });
      }
    }
  });
  
  return relationships;
}

function determineEntityType(entity, text) {
  const context = text.toLowerCase();
  const entityLower = entity.toLowerCase();
  
  if (context.includes(`${entityLower} is a`) || context.includes(`${entityLower} are`)) {
    return 'concept';
  }
  if (context.includes(`${entityLower} defined as`) || context.includes(`${entityLower} means`)) {
    return 'definition';
  }
  if (context.includes(`${entityLower} process`) || context.includes(`${entityLower} method`)) {
    return 'process';
  }
  if (context.includes(`${entityLower} example`) || context.includes(`${entityLower} instance`)) {
    return 'example';
  }
  
  return 'entity';
}

function extractDefinition(entity, text) {
  const sentences = text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(entity.toLowerCase())) {
      if (sentence.includes('defined as') || sentence.includes('means') || sentence.includes('is a')) {
        return sentence.trim();
      }
    }
  }
  
  return `Entity: ${entity}`;
}

function determineRelationshipType(sentence, fromEntity, toEntity) {
  const sentLower = sentence.toLowerCase();
  
  if (sentLower.includes('part of') || sentLower.includes('component')) {
    return 'part_of';
  }
  if (sentLower.includes('example') || sentLower.includes('instance')) {
    return 'example_of';
  }
  if (sentLower.includes('cause') || sentLower.includes('leads to')) {
    return 'causes';
  }
  if (sentLower.includes('related') || sentLower.includes('connected')) {
    return 'related_to';
  }
  if (sentLower.includes('similar') || sentLower.includes('like')) {
    return 'similar_to';
  }
  
  return 'associated_with';
}

function resolveConflictsWithRules(conflicts) {
  const resolutions = [];
  
  conflicts.forEach(conflict => {
    if (conflict.type === 'duplicate_nodes') {
      resolutions.push({
        type: 'merge',
        explanation: `Merging duplicate nodes: ${conflict.node1.label} and ${conflict.node2.label}`,
        confidence: 0.8
      });
    } else if (conflict.type === 'contradictory_relationships') {
      resolutions.push({
        type: 'branch',
        explanation: `Creating separate branches for contradictory relationships: ${conflict.relationship1.type} vs ${conflict.relationship2.type}`,
        confidence: 0.7
      });
    } else {
      resolutions.push({
        type: 'clarify',
        explanation: `Manual clarification needed for: ${conflict.description}`,
        confidence: 0.5
      });
    }
  });
  
  return { resolutions };
}

function suggestConnectionsWithRules(nodeLabel, existingConnections) {
  const suggestions = [];
  const existingLabels = existingConnections.map(conn => conn.label.toLowerCase());
  
  // Common educational relationships
  const commonRelationships = [
    { target: 'Definition', type: 'has_definition', confidence: 0.9 },
    { target: 'Example', type: 'has_example', confidence: 0.8 },
    { target: 'Application', type: 'applies_to', confidence: 0.7 },
    { target: 'Related Concept', type: 'related_to', confidence: 0.6 },
    { target: 'Prerequisite', type: 'requires', confidence: 0.7 }
  ];
  
  commonRelationships.forEach(rel => {
    if (!existingLabels.includes(rel.target.toLowerCase())) {
      suggestions.push({
        targetConcept: rel.target,
        relationshipType: rel.type,
        confidence: rel.confidence,
        reasoning: `Common educational relationship for ${nodeLabel}`
      });
    }
  });
  
  return { suggestions };
}

function expandNodeWithRules(label, type, description) {
  const expansions = {
    subConcepts: [],
    examples: [],
    relatedTopics: [],
    keyQuestions: []
  };
  
  // Generate sub-concepts based on type
  if (type === 'concept') {
    expansions.subConcepts = [
      { name: `${label} Properties`, type: 'property', definition: `Characteristics of ${label}` },
      { name: `${label} Types`, type: 'category', definition: `Different types of ${label}` },
      { name: `${label} Applications`, type: 'application', definition: `How ${label} is used` }
    ];
  }
  
  // Generate examples
  expansions.examples = [
    `Example of ${label} in practice`,
    `Real-world application of ${label}`,
    `Theoretical context for ${label}`
  ];
  
  // Generate related topics
  expansions.relatedTopics = [
    `Fundamentals related to ${label}`,
    `Advanced topics in ${label}`,
    `Historical context of ${label}`
  ];
  
  // Generate key questions
  expansions.keyQuestions = [
    `What is the definition of ${label}?`,
    `How does ${label} work?`,
    `Why is ${label} important?`,
    `Where is ${label} applied?`
  ];
  
  return expansions;
}
