# EdTech Knowledge Graph Platform

A real-time collaborative knowledge graph that converts live inputs into a dynamic, interconnected "knowledge brain." Built with React, Neo4j, Socket.io, and AI-powered entity extraction.

## 🚀 Features

### Core Functionality
- **Dynamic Entity Extraction Engine**: Multi-step agentic AI identifies concepts, definitions, and relationships from raw input
- **Real-Time Graph Synchronization**: WebSocket-based sync enabling instant node and edge updates across users
- **Interactive Graph Canvas**: Built with react-flow, supporting zoom, drag, expand, and smooth performance at scale (50+ nodes)
- **Graph Storage Layer**: Persistent storage using Neo4j with efficient relationship traversal queries
- **Conflict Resolution Engine**: AI detects contradictory inputs and resolves them via mediation or branched node creation
- **Deep-Link Path Search**: Executes multi-hop queries to reveal relationships between distant concepts
- **Smart Node Expansion**: On interaction, AI suggests and generates missing conceptual links dynamically

### Technical Features
- **Multi-user Collaboration**: Real-time cursor tracking and user presence
- **AI-Powered Analysis**: OpenAI integration for intelligent content processing
- **Graph Algorithms**: Path finding, centrality analysis, and connectivity metrics
- **Import/Export**: JSON-based graph data persistence
- **Responsive Design**: Modern UI with Framer Motion animations

## 🛠️ Tech Stack

### Frontend
- **React 19** - Core UI framework
- **React Flow** - Interactive graph visualization
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling

### Backend
- **Express.js** - REST API server
- **Socket.io** - WebSocket server
- **Neo4j** - Graph database
- **OpenAI API** - AI-powered analysis
- **Compromise.js** - Natural language processing

### Infrastructure
- **Node.js** - Runtime environment
- **Vite** - Build tool and dev server
- **Concurrently** - Run client and server together

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **Neo4j Database** (v5 or higher)
3. **OpenAI API Key** (for AI features)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd Pixel-Pioneers_PS-13
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

Required environment variables:
```env
# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:5173

# Neo4j Database
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start Neo4j
```bash
# Using Neo4j Desktop
# Or using Docker
docker run \
    --publish=7474:7474 --publish=7687:7687 \
    --volume=$HOME/neo4j/data:/data \
    neo4j:latest
```

### 4. Run the Application
```bash
# Start both client and server
npm run dev

# Or separately:
npm run dev:client  # Frontend on http://localhost:5173
npm run dev:server  # Backend on http://localhost:3001
```

## 📊 API Endpoints

### Graph Operations
- `GET /api/graph` - Get entire graph
- `POST /api/graph/nodes` - Create new node
- `PUT /api/graph/nodes/:id` - Update node
- `DELETE /api/graph/nodes/:id` - Delete node
- `POST /api/graph/edges` - Create new edge
- `PUT /api/graph/edges/:id` - Update edge
- `DELETE /api/graph/edges/:id` - Delete edge
- `GET /api/graph/search?query=...` - Search nodes
- `GET /api/graph/path/:fromId/:toId` - Find path between nodes

### AI Operations
- `POST /api/ai/extract` - Extract entities from text
- `POST /api/ai/resolve-conflicts` - Resolve graph conflicts
- `POST /api/ai/suggest-connections` - Get AI-suggested connections
- `POST /api/ai/expand-node/:nodeId` - Expand node with AI

## 🎯 Usage Guide

### Creating Knowledge Graph

1. **Manual Creation**:
   - Shift+Click on canvas to create nodes
   - Drag from node to node to create edges
   - Use toolbar for advanced operations

2. **AI-Powered Creation**:
   - Click the Brain button (green)
   - Paste or type educational content
   - AI extracts concepts, definitions, and relationships
   - Automatically creates nodes and edges

3. **Node Expansion**:
   - Select a node
   - Click the Branch button (purple)
   - AI suggests related concepts and connections
   - Choose which suggestions to add

### Real-Time Collaboration

- Multiple users can edit the same graph simultaneously
- See other users' cursors and selections
- Changes sync instantly across all connected clients
- User presence indicators show active collaborators

### Advanced Features

1. **Path Finding**:
   - Click Search button (blue)
   - Enter start and end nodes
   - Choose algorithm (shortest path, all paths, weighted)
   - Visualize connections between distant concepts

2. **Conflict Resolution**:
   - AI detects duplicate nodes and contradictory relationships
   - Automatic resolution for high-confidence conflicts
   - Manual review options for complex cases

3. **Graph Analysis**:
   - Node centrality metrics
   - Connectivity analysis
   - Path optimization

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/
│   ├── graph/          # Graph visualization components
│   ├── ui/             # Reusable UI components
│   └── layout/          # Layout components
├── services/
│   ├── api/             # API service layer
│   ├── socket/          # WebSocket client
│   └── ai/              # AI service layer
├── stores/              # Zustand state management
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
└── types/               # TypeScript definitions
```

### Backend Structure
```
server/
├── routes/              # API route handlers
├── controllers/         # Business logic
├── models/              # Database schemas
├── services/            # Service layer
├── middleware/          # Express middleware
└── config/              # Configuration files
```

## 🔧 Development

### Adding New Features

1. **New Node Types**:
   - Update `NODE_TYPES` in `server/models/graphSchema.js`
   - Add corresponding icon and color in `src/components/graph/CustomNode.jsx`

2. **New Relationship Types**:
   - Update `RELATIONSHIP_TYPES` in `server/models/graphSchema.js`
   - Add styling in `src/components/graph/CustomEdge.jsx`

3. **AI Features**:
   - Extend `entityExtractionService.js` for new analysis types
   - Add corresponding API endpoints in `server/controllers/aiController.js`

### Testing

```bash
# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## 📈 Performance

### Optimizations
- **Virtual Scrolling**: For large graphs (1000+ nodes)
- **Lazy Loading**: Load graph data on demand
- **Debounced Updates**: Batch real-time changes
- **Caching**: AI responses and graph queries
- **Efficient Algorithms**: Optimized path finding and traversal

### Benchmarks
- **50 nodes**: Smooth 60fps performance
- **200 nodes**: Acceptable performance with virtualization
- **1000+ nodes**: Requires pagination and lazy loading

## 🐛 Troubleshooting

### Common Issues

1. **Neo4j Connection Failed**:
   - Check Neo4j is running
   - Verify URI, username, password in .env
   - Ensure network connectivity

2. **OpenAI API Errors**:
   - Verify API key is valid
   - Check API quota and billing
   - Ensure network can reach OpenAI

3. **Socket.io Connection Issues**:
   - Check CORS settings
   - Verify client and server URLs
   - Check firewall settings

4. **Performance Issues**:
   - Enable virtualization for large graphs
   - Check browser console for errors
   - Monitor memory usage

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Database queries only
DEBUG=neo4j npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style
- Use ESLint configuration
- Follow React best practices
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **React Flow** - Graph visualization library
- **Neo4j** - Graph database
- **OpenAI** - AI-powered analysis
- **Framer Motion** - Animation library
- **Lucide** - Icon library

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

---

Built with ❤️ for collaborative learning and knowledge sharing.
