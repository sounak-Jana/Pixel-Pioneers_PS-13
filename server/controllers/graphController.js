import { getSession } from '../config/database.js';

export const createNode = async (req, res) => {
  try {
    const { id, label, type, properties, x, y } = req.body;
    const session = getSession();
    
    const result = await session.run(
      `CREATE (n:Node {
        id: $id,
        label: $label,
        type: $type,
        properties: $properties,
        x: $x,
        y: $y,
        createdAt: datetime(),
        updatedAt: datetime()
      }) RETURN n`,
      { id, label, type, properties, x, y }
    );
    
    await session.close();
    res.json(result.records[0].get('n').properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createEdge = async (req, res) => {
  try {
    const {
      id,
      fromNode,
      toNode,
      source,
      target,
      relationship,
      properties
    } = req.body;
    const resolvedFrom = fromNode || source;
    const resolvedTo = toNode || target;
    const session = getSession();
    
    const result = await session.run(
      `MATCH (a:Node {id: $fromNode}), (b:Node {id: $toNode})
       CREATE (a)-[r:RELATIONSHIP {
         id: $id,
         relationship: $relationship,
         properties: $properties,
         createdAt: datetime(),
         updatedAt: datetime()
       }]->(b) RETURN r`,
      { id, fromNode: resolvedFrom, toNode: resolvedTo, relationship, properties }
    );
    
    await session.close();
    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGraph = async (req, res) => {
  try {
    const session = getSession();
    
    const nodesResult = await session.run('MATCH (n:Node) RETURN n');
    const edgesResult = await session.run('MATCH (a:Node)-[r:RELATIONSHIP]->(b:Node) RETURN a, r, b');
    
    const nodes = nodesResult.records.map(record => record.get('n').properties);
    const edges = edgesResult.records.map(record => {
      const sourceId = record.get('a').properties.id;
      const targetId = record.get('b').properties.id;
      return {
        ...record.get('r').properties,
        source: sourceId,
        target: targetId,
        from: sourceId,
        to: targetId
      };
    });
    
    await session.close();
    res.json({ nodes, edges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateNode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const session = getSession();
    
    const result = await session.run(
      `MATCH (n:Node {id: $id})
       SET n += $updates, n.updatedAt = datetime()
       RETURN n`,
      { id, updates }
    );
    
    await session.close();
    res.json(result.records[0].get('n').properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEdge = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const session = getSession();
    
    const result = await session.run(
      `MATCH ()-[r:RELATIONSHIP {id: $id}]->()
       SET r += $updates, r.updatedAt = datetime()
       RETURN r`,
      { id, updates }
    );
    
    await session.close();
    res.json(result.records[0].get('r').properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNode = async (req, res) => {
  try {
    const { id } = req.params;
    const session = getSession();
    
    await session.run(
      `MATCH (n:Node {id: $id})
       DETACH DELETE n`,
      { id }
    );
    
    await session.close();
    res.json({ message: 'Node deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEdge = async (req, res) => {
  try {
    const { id } = req.params;
    const session = getSession();
    
    await session.run(
      `MATCH ()-[r:RELATIONSHIP {id: $id}]->()
       DELETE r`,
      { id }
    );
    
    await session.close();
    res.json({ message: 'Edge deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchNodes = async (req, res) => {
  try {
    const { query } = req.query;
    const session = getSession();
    
    const result = await session.run(
      `MATCH (n:Node)
       WHERE n.label CONTAINS $query OR n.type CONTAINS $query
       RETURN n LIMIT 20`,
      { query }
    );
    
    const nodes = result.records.map(record => record.get('n').properties);
    await session.close();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const findPath = async (req, res) => {
  try {
    const { fromId, toId } = req.params;
    const session = getSession();
    
    const result = await session.run(
      `MATCH path = shortestPath((a:Node {id: $fromId})-[*]-(b:Node {id: $toId}))
       RETURN path`,
      { fromId, toId }
    );
    
    if (result.records.length === 0) {
      return res.json({ path: null });
    }
    
    const path = result.records[0].get('path');
    const segments = path.segments.map(segment => ({
      start: segment.start.properties,
      relationship: {
        ...segment.relationship.properties,
        type: segment.relationship.type
      },
      end: segment.end.properties
    }));
    
    await session.close();
    res.json({ path: { segments } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getConnectedNodes = async (req, res) => {
  try {
    const { id } = req.params;
    const session = getSession();
    
    const result = await session.run(
      `MATCH (n:Node {id: $id})-[r]-(connected:Node)
       RETURN connected, r LIMIT 50`,
      { id }
    );
    
    const connections = result.records.map(record => ({
      node: record.get('connected').properties,
      relationship: record.get('r').properties
    }));
    
    await session.close();
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
