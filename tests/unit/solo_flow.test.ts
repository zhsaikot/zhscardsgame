import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import express from 'express';
import { setupSocketHandlers } from '../../src/server/socket/handlers.js';

describe('End-to-End Solo Game Socket Flow', () => {
  let httpServer: any;
  let ioServer: Server;
  let clientSocket: ClientSocket;
  const PORT = 4099;

  beforeAll(async () => {
    const app = express();
    httpServer = createServer(app);
    ioServer = new Server(httpServer, {
      cors: { origin: '*' },
    });
    setupSocketHandlers(ioServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(PORT, () => resolve());
    });
  });

  afterAll(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    await new Promise<void>((resolve) => {
      ioServer.close(() => {
        httpServer.close(() => resolve());
      });
    });
  });

  it('should start solo game, deal initial 4 cards, bid/select trump, and deal 8 total cards', async () => {
    clientSocket = Client(`http://localhost:${PORT}`, {
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => resolve());
    });

    const myPlayerId = 'human_test_player';

    // Set up promises for phases
    const cardsPromise = new Promise<any>((resolve) => {
      clientSocket.on('cards:dealt', (data) => {
        resolve(data);
      });
    });

    const trumpPromise = new Promise<any>((resolve) => {
      clientSocket.on('trump:selected', (data) => {
        resolve(data);
      });
    });

    // Handle human turns during bidding
    clientSocket.on('bid:turn', (data) => {
      if (data.currentTurn === 1) {
        // Human is in Seat 1; place bid or pass
        if (!data.gameState.highestBid) {
          clientSocket.emit('bid:place', { playerId: myPlayerId, amount: 16 });
        } else {
          clientSocket.emit('bid:pass', { playerId: myPlayerId });
        }
      }
    });

    // Handle human trump selection if winning bidder
    clientSocket.on('trump:selection', (data) => {
      if (data.playerId === 1) {
        clientSocket.emit('trump:select', { playerId: myPlayerId, suit: 'spades' });
      }
    });

    // Emit startSolo
    clientSocket.emit('game:startSolo', {
      playerId: myPlayerId,
      username: 'TestHero',
    });

    // 1. Verify initial deal has 4 cards
    const initialCardsData = await cardsPromise;
    expect(initialCardsData).toBeDefined();
    expect(initialCardsData.gameState).toBeDefined();

    const humanPlayer = initialCardsData.gameState.players.find((p: any) => p.id === myPlayerId);
    expect(humanPlayer).toBeDefined();
    expect(humanPlayer.hand).toBeDefined();
    expect(humanPlayer.hand.length).toBe(4);

    humanPlayer.hand.forEach((card: any) => {
      expect(['spades', 'hearts', 'diamonds', 'clubs']).toContain(card.suit);
      expect(['J', '9', 'A', '10', 'K', 'Q', '8', '7']).toContain(card.rank);
      expect(typeof card.pointValue).toBe('number');
    });

    const bots = initialCardsData.gameState.players.filter((p: any) => p.isBot);
    expect(bots.length).toBe(3);

    // 2. Wait for bidding + trump selection to complete (bots make decisions with realistic delays)
    const trumpData = await trumpPromise;
    expect(trumpData).toBeDefined();
    expect(trumpData.gameState).toBeDefined();
    expect(trumpData.gameState.phase).toBe('PLAYING');

    // 3. Verify all 8 cards are dealt to human player
    const humanWith8Cards = trumpData.gameState.players.find((p: any) => p.id === myPlayerId);
    expect(humanWith8Cards).toBeDefined();
    expect(humanWith8Cards.hand.length).toBe(8);
  }, 20000);
});

