import express from 'express';
import { 
  createNode, 
  createEdge, 
  getGraph, 
  updateNode, 
  updateEdge, 
  deleteNode, 
  deleteEdge,
  searchNodes,
  findPath,
  getConnectedNodes
} from '../controllers/graphController.js';

const router = express.Router();

// Node operations
router.post('/nodes', createNode);
router.get('/nodes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await import('../config/database.js').then(m => m.getSession());
    const result = await session.run(
      'MATCH (n:Node {id: $id}) RETURN n',
      { id }
    );
    await session.close();
    
    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const node = result.records[0].get('n').properties;
    res.json(node);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.put('/nodes/:id', updateNode);
router.delete('/nodes/:id', deleteNode);

// Edge operations
router.post('/edges', createEdge);
router.put('/edges/:id', updateEdge);
router.delete('/edges/:id', deleteEdge);

// Graph operations
router.get('/', getGraph);
router.get('/search', searchNodes);
router.get('/path/:fromId/:toId', findPath);
router.get('/nodes/:id/connected', getConnectedNodes);

export default router;
