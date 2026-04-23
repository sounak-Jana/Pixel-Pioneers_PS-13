import OpenAI from 'openai';
import nlp from 'compromise';
import { getSession } from '../config/database.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const extractEntities = async (req, res) => {
  try {
    const { text } = req.body;
    
    // Use compromise for basic NLP extraction
    const doc = nlp(text);
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    const adjectives = doc.adjectives().out('array');
    
    // Use OpenAI for advanced entity and relationship extraction
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Extract entities, definitions, and relationships from the given text. Return JSON with entities (name, type, definition) and relationships (from, to, type)."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
    });
    
    const aiResult = JSON.parse(completion.choices[0].message.content);
    
    // Combine NLP and AI results
    const entities = {
      nouns,
      verbs,
      adjectives,
      aiExtracted: aiResult.entities || []
    };
    
    res.json({
      entities,
      relationships: aiResult.relationships || [],
      rawText: text
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resolveConflicts = async (req, res) => {
  try {
    const { conflicts } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a conflict resolution mediator for knowledge graphs. Analyze the conflicts and suggest resolutions: merge, branch, or clarify. Return JSON with resolution type and explanation."
        },
        {
          role: "user",
          content: JSON.stringify(conflicts)
        }
      ],
      temperature: 0.2,
    });
    
    const resolution = JSON.parse(completion.choices[0].message.content);
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
    
    // Use AI to suggest new connections
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Based on the node context and existing connections, suggest 3-5 new meaningful connections. Return JSON with suggestions array containing: targetConcept, relationshipType, confidence, reasoning."
        },
        {
          role: "user",
          content: `Node: ${context.nodeLabel}\nExisting connections: ${JSON.stringify(existingConnections)}\nContext: ${context.description}`
        }
      ],
      temperature: 0.4,
    });
    
    const suggestions = JSON.parse(completion.choices[0].message.content);
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
    
    // Use AI to generate expansion content
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Expand on the given concept with related sub-concepts, examples, and connections. Return JSON with: subConcepts (name, type, definition), examples, relatedTopics, keyQuestions."
        },
        {
          role: "user",
          content: `Concept: ${node.label}\nType: ${node.type}\nDescription: ${node.properties?.description || ''}`
        }
      ],
      temperature: 0.3,
    });
    
    const expansion = JSON.parse(completion.choices[0].message.content);
    await session.close();
    
    res.json({
      originalNode: node,
      expansion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
