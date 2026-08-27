# 29 Card Game - README

A premium, production-ready web-based multiplayer card game implementing the classic "29" trick-taking game.

## 🎮 Game Overview

**29** is a popular trick-taking card game played with 4 players in 2 teams. The game uses a 32-card deck and features bidding, trump selection, and strategic gameplay.

### Key Features

- **Multiplayer**: 4 players (2 teams of 2)
- **Teams**: Seats 1+3 vs Seats 2+4
- **Deck**: 32 cards (J, 9, A, 10, K, Q, 8, 7 in each suit)
- **Card Values**: J=3, 9=2, A=1, 10=1, K/Q/8/7=0
- **Total Points**: 29 (28 card points + 1 final trick bonus)
- **Bidding**: 16-28 points
- **Server-Authoritative**: All game logic validated server-side

## 📁 Project Structure

```
/workspace
├── src/
│   ├── shared/           # Shared types, constants, utilities
│   │   ├── types/        # TypeScript interfaces
│   │   ├── constants/    # Game rules and values
│   │   └── utils/        # Pure game functions
│   ├── server/           # Server-side code
│   │   ├── engine/       # GameEngine class
│   │   ├── services/     # GameService singleton
│   │   ├── socket/       # WebSocket handlers
│   │   └── index.ts      # Server entry point
│   └── client/           # React frontend
│       ├── components/   # UI components
│       ├── pages/        # Page components
│       ├── game/         # Game state management
│       └── styles/       # CSS styles
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── gameplay/         # Gameplay simulation tests
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Install Dependencies

```bash
cd /workspace
npm install
```

## 🛠️ Development

### Start Development Servers

```bash
# Start both client and server
npm run dev

# Or separately:
npm run server    # Backend on port 4000
npm run client    # Frontend on port 3000
```

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Gameplay tests
npm run test:gameplay
```

## 🎯 How to Play

### Starting a Game

1. Open the application in your browser
2. Enter your username
3. Click "Create Game" or join an existing game with a Game ID
4. Wait for 4 players to join
5. All players click "Ready"
6. Game starts automatically

### Game Flow

1. **Initial Deal**: Each player receives 4 cards
2. **Bidding Phase**: 
   - Minimum bid: 16
   - Maximum bid: 28
   - Players can bid or pass
   - Highest bidder wins
3. **Trump Selection**: Winning bidder chooses trump suit
4. **Second Deal**: Each player receives 4 more cards (8 total)
5. **Trick Play**: 
   - Winner of bid leads first trick
   - Must follow lead suit if possible
   - Trump beats all non-trump cards
   - 8 tricks total
6. **Scoring**: 
   - Card points summed per team
   - Final trick bonus: +1 point
   - Total always equals 29
   - Bidder team must meet their bid

### Card Ranking (High to Low)

J > 9 > A > 10 > K > Q > 8 > 7

### Teams

- **Team A**: Seats 1 and 3
- **Team B**: Seats 2 and 4

## 🔧 Configuration

Game rules can be customized via `GameSettings`:

```typescript
{
  minBid: 16,          // Minimum bid allowed
  maxBid: 28,          // Maximum bid allowed
  hiddenTrump: false,  // Whether trump is hidden
  finalTrickBonus: 1,  // Points for winning final trick
  dealerRotation: 'clockwise',
  scoringMode: 'classic',
  winningScore: 0      // 0 = fixed rounds, >0 = score threshold
}
```

## 🌐 API Reference

### REST Endpoints

- `GET /api/health` - Health check
- `GET /api/games/:gameId` - Get game state
- `POST /api/games` - Create game
- `POST /api/games/:gameId/join` - Join game

### WebSocket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `game:join` | `{ gameId, playerId, username }` | Join a game |
| `game:leave` | `{ playerId }` | Leave a game |
| `player:ready` | `{ playerId, ready }` | Set ready status |
| `bid:place` | `{ playerId, amount }` | Place a bid |
| `bid:pass` | `{ playerId }` | Pass on bidding |
| `trump:select` | `{ playerId, suit }` | Select trump suit |
| `card:play` | `{ playerId, cardId }` | Play a card |
| `game:request` | `{ playerId, gameId }` | Request game state |
| `game:reconnect` | `{ playerId, gameId }` | Reconnect to game |
| `game:nextRound` | `{ playerId }` | Start next round |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `player:joined` | Player info | Player joined game |
| `player:left` | Player info | Player left game |
| `game:started` | Game state | Game has started |
| `cards:dealt` | Game state | Cards dealt to players |
| `bid:turn` | Current turn info | Your turn to bid |
| `bid:placed` | Bid info | Bid was placed |
| `bid:passed` | Player info | Player passed |
| `bid:completed` | Winner info | Bidding complete |
| `trump:selection` | Player info | Time to select trump |
| `trump:selected` | Suit info | Trump selected |
| `trump:revealed` | Suit info | Trump revealed |
| `turn:changed` | Turn info | Turn changed |
| `card:played` | Card info | Card was played |
| `trick:completed` | Winner info | Trick completed |
| `round:completed` | Round results | Round complete |
| `game:completed` | Game results | Game complete |
| `game:state` | Game state | Full game state |
| `error` | Error message | Error occurred |

## 🧪 Testing

The project includes comprehensive tests:

### Unit Tests

- Deck creation and shuffling
- Card dealing
- Trick winner determination
- Card play validation
- Bid validation
- Score calculation

### Running Tests

```bash
npm test
```

## 🔒 Security

- **Server-Authoritative**: All game logic runs on server
- **Input Validation**: All client inputs validated
- **Anti-Cheat**: Hidden information not sent to clients
- **Rate Limiting**: API endpoints protected
- **CORS**: Properly configured for security
- **Helmet**: Security headers enabled

## 📱 Responsive Design

The game is fully responsive and works on:

- Desktop (1024px+)
- Tablet (768px-1023px)
- Mobile (320px-767px)

## 🎨 UI Features

- Premium dark theme
- Gold accent colors
- Smooth animations
- Touch-friendly controls
- Clear visual feedback
- Card hover effects
- Selected card highlighting
- Legal move indicators

## 🏗️ Architecture

### Server Authority

The server is the single source of truth:

- Validates all moves
- Manages game state
- Enforces rules
- Calculates scores
- Prevents cheating

### Client Responsibilities

- Display game state
- Capture user input
- Show animations
- Provide feedback

### Modular Design

- **GameEngine**: Core game logic
- **ScoreEngine**: Scoring calculations
- **GameService**: Multi-game management
- **Socket Handlers**: Real-time communication

## 🔄 Future Enhancements

The architecture supports adding:

- User authentication
- Database persistence
- Player profiles
- Matchmaking system
- Bot opponents
- Game history/replay
- Chat system
- Tournaments
- Multiple rule variants
- Statistics tracking

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📞 Support

For issues or questions, please open an issue on the repository.
