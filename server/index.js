import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import graphRoutes from './routes/graph.js';
import aiRoutes from './routes/ai.js';
import { initializeSocket } from './services/socketService.js';
import { connectToNeo4j } from './config/database.js';
import { initializeSchema } from './models/graphSchema.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/graph', graphRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO
initializeSocket(io);

// Connect to Neo4j and initialize schema
connectToNeo4j()
  .then(() => {
    return initializeSchema();
  })
  .catch(console.error);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Graph API: http://localhost:${PORT}/api/graph`);
  console.log(`🤖 AI API: http://localhost:${PORT}/api/ai`);
});
