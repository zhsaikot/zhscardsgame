import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GameService } from './services/GameService.js';
import { setupSocketHandlers } from './socket/handlers.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get game state endpoint
app.get('/api/games/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { playerId } = req.query;
  
  const gameService = GameService.getInstance();
  const engine = gameService.getGame(gameId);
  
  if (!engine) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  const state = engine.getGameState(playerId as string);
  res.json(state);
});

// Create game endpoint
app.post('/api/games', (req, res) => {
  const { playerId, username, settings } = req.body;
  
  if (!playerId || !username) {
    return res.status(400).json({ error: 'playerId and username are required' });
  }
  
  const gameService = GameService.getInstance();
  const gameId = gameService.createGame(settings);
  const engine = gameService.getGame(gameId);
  
  if (!engine) {
    return res.status(500).json({ error: 'Failed to create game' });
  }
  
  // Add the creator to the game
  const result = engine.addPlayer(playerId, username, 'http');
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.status(201).json({ 
    gameId, 
    seat: result.seat,
    message: 'Game created successfully' 
  });
});

// Join game endpoint
app.post('/api/games/:gameId/join', (req, res) => {
  const { gameId } = req.params;
  const { playerId, username } = req.body;
  
  if (!playerId || !username) {
    return res.status(400).json({ error: 'playerId and username are required' });
  }
  
  const gameService = GameService.getInstance();
  const engine = gameService.getGame(gameId);
  
  if (!engine) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  const result = engine.addPlayer(playerId, username, 'http');
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({ 
    gameId, 
    seat: result.seat,
    message: 'Joined game successfully' 
  });
});

// Setup WebSocket handlers
setupSocketHandlers(io);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`🎮 29 Card Game Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

export { app, io, httpServer };
