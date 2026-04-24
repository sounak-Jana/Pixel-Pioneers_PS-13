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
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5174';
const allowedOrigins = [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:5175', 'http://127.0.0.1:5175'];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin denied: ${origin}`));
      }
    },
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
  .then((driver) => {
    if (driver) {
      return initializeSchema();
    }
    return Promise.resolve();
  })
  .catch((error) => {
    console.error('❌ Startup error:', error);
  })
  .finally(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Graph API: http://localhost:${PORT}/api/graph`);
      console.log(`🤖 AI API: http://localhost:${PORT}/api/ai`);
    });
  });
