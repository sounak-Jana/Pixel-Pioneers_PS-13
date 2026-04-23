import express from 'express';
import { 
  extractEntities, 
  resolveConflicts, 
  suggestConnections,
  expandNode
} from '../controllers/aiController.js';

const router = express.Router();

// AI-powered operations
router.post('/extract', extractEntities);
router.post('/resolve-conflicts', resolveConflicts);
router.post('/suggest-connections', suggestConnections);
router.post('/expand-node/:nodeId', expandNode);

export default router;
