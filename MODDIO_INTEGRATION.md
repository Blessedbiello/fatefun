# Moddio Game Engine Integration - FATE Protocol

## Overview

Complete Moddio multiplayer game engine integration for real-time PvP prediction battles with Solana blockchain synchronization.

## Project Structure

```
game/
├── moddio.config.js          # Main configuration
├── src/
│   ├── Game.js               # Main game engine
│   ├── entities/
│   │   ├── Player.js         # Player entity with movement & predictions
│   │   ├── PredictionOrb.js  # Visual prediction indicators
│   │   └── PriceChart.js     # Real-time price chart
│   ├── scenes/
│   │   ├── Lobby.js          # Pre-match waiting room
│   │   ├── Arena.js          # Main gameplay scene
│   │   └── Results.js        # Post-match results
│   ├── network/
│   │   └── SolanaSync.js     # Blockchain sync layer
│   └── ui/                   # UI components (to be extended)
└── assets/
    ├── sprites/              # Game sprites
    └── sounds/               # Sound effects
```

## Core Features

### 1. Configuration (moddio.config.js)

**Server Settings:**
- Port: 2001
- Max players: 10 per match
- Tick rate: 60 FPS
- Match duration: 5 minutes default

**Room Management:**
- Matchmaking enabled
- Min 2, max 10 players
- 30-second wait time
- Spectator support (up to 50)

**Network:**
- Interpolation: Enabled
- Compression: Enabled
- Update rate: 20 Hz
- Sync interval: 100ms

**Solana Integration:**
- Network: devnet/mainnet
- Sync interval: 2 seconds
- Real-time price feeds
- Match account subscriptions

**Chat & Emotes:**
- Chat enabled (200 char max, 1 msg/second)
- 8 emotes: 🚀 🐻 🔥 🎮 😂 😢 🤔 🎉
- 3-second cooldown

### 2. Entities

#### Player.js
**Properties:**
- Position (x, y), velocity, rotation
- Wallet address, username, level, tier
- Prediction state (higher/lower)
- Visual color (deterministic from address)
- Stats: entry fee, streak, win rate

**Methods:**
- `update(deltaTime)` - Movement & bounds
- `setVelocity(vx, vy)` - WASD movement
- `predict(side)` - Make prediction
- `showEmoteIcon(emoteId)` - Display emote (3s)
- `showChat(message)` - Chat bubble (5s)
- `serialize()` - Network sync

**Features:**
- 5 deterministic color schemes from address
- Level badge with tier colors
- Emote & chat bubble system
- Prediction animation triggers

#### PredictionOrb.js
**Properties:**
- Player ID & prediction side
- Position spawns at player
- Color: Green (higher) / Red (lower)
- Pulsing & floating animations
- 60-second lifetime with fade

**Animations:**
- Pulse scale: 1 ± 0.1 (2 Hz)
- Float offset: ±10px (1.5 Hz)
- Glow: 100-255 alpha cycling
- Fade out last 5 seconds

**Rendering:**
- Radial gradient glow
- Colored orb body
- Emoji icon (📈/📉)

#### PriceChart.js
**Properties:**
- 600×300 chart display
- 60 data points max
- Starting price line (yellow dashed)
- Higher zone (green) / Lower zone (red)
- Real-time price line (purple)

**Features:**
- Auto-scaling Y-axis
- Smooth price interpolation
- Current price indicator
- Price change % display
- Trend detection

### 3. Scenes

#### Lobby.js
**Purpose:** Pre-match waiting room

**UI Elements:**
- Match info panel (market, entry fee, ID)
- Player list with ready status
- Ready/Cancel button
- Chat interface
- Leave match button

**Features:**
- Player join/leave notifications
- Ready status tracking (✓/○)
- Auto-start when all ready
- 30-second countdown
- System messages in chat

**Flow:**
1. Players join match
2. Click "Ready Up" when prepared
3. When all ready, countdown starts
4. Transition to Arena scene

#### Arena.js
**Purpose:** Main gameplay - make predictions & watch prices

**UI Elements:**
- Price chart (top center)
- Countdown timer (large, center)
- Prediction buttons (HIGHER 📈 / LOWER 📉)
- Match info panel (left)
- Scoreboard (right)

**Controls:**
- WASD / Arrow keys: Move player
- Click HIGHER/LOWER: Make prediction
- Movement syncs to server

**Features:**
- Real-time price chart updates
- Player avatars with level badges
- Prediction orbs spawn on choice
- Countdown to resolution
- Live scoreboard (higher vs lower count)
- Camera follows local player

**States:**
- `prediction`: Players can make predictions
- `resolution`: Waiting for final price
- `ended`: Match complete, transition to results

#### Results.js
**Purpose:** Post-match results display

**Features:**
- YOU WON/LOST banner (green/red)
- Winnings display (+X.XX SOL)
- Match summary (winning side, final price)
- Top 10 winners leaderboard
- Continue button → return to menu

### 4. Network Layer

#### SolanaSync.js
**Purpose:** Bridge Moddio game state ↔ Solana blockchain

**Subscriptions:**
- Match account: WebSocket + polling fallback
- Pyth price feed: Real-time prices
- 2-second sync interval

**Key Methods:**
- `subscribeToMatch(matchPubkey)` - Listen to match updates
- `subscribeToPriceFeed(pythPriceFeed)` - Listen to prices
- `submitPrediction(matchId, prediction)` - Submit to blockchain
- `syncMatchState(match)` - Update game from blockchain

**Data Flow:**
```
Blockchain (Solana)
       ↕ WebSocket/Polling
  SolanaSync.js
       ↕ Events
  Game.js (Moddio)
       ↕ Network
  Players (Clients)
```

**Events Emitted:**
- `blockchain-match-update` - Match state changed
- `price-update` - New price from Pyth
- `match-state-sync` - Synced game state

**Fallbacks:**
- WebSocket fails → Polling (2s interval)
- Price feed: 1-second poll if WS fails

### 5. Main Game Engine (Game.js)

**Core Systems:**
- Canvas rendering (1920×1080)
- Camera system (smooth follow)
- UI system (panels, buttons, chat)
- Input system (keyboard)
- Network system (Moddio server)
- Solana sync layer

**Game Loop:**
1. Calculate deltaTime
2. Update current scene
3. Update camera (smooth follow)
4. Update UI
5. Render scene
6. Render UI
7. Render debug info (if enabled)

**Scene Management:**
```typescript
game.registerScene('lobby', Lobby)
game.registerScene('arena', Arena)
game.registerScene('results', Results)

game.changeScene('lobby', matchData)
```

**Event System:**
```typescript
game.on('player-joined', (player) => {...})
game.on('price-update', (data) => {...})
game.emit('custom-event', data)
```

## Integration with FATE Protocol

### Next.js Integration

```typescript
// In Next.js component
import FateGame from '@/game/src/Game'

const GameContainer = () => {
  const gameRef = useRef(null)

  useEffect(() => {
    const game = new FateGame(gameRef.current)

    // Initialize with Solana wallet
    game.initialize(wallet, connection, program)
    game.changeScene('lobby', matchData)
    game.start()

    return () => game.destroy()
  }, [])

  return <div ref={gameRef} />
}
```

### Blockchain State Sync

**Match Creation:**
1. User creates match on-chain → Gets match PubKey
2. Moddio creates room with match ID
3. SolanaSync subscribes to match account
4. Players join room and wallet connects

**Prediction Flow:**
1. Player clicks HIGHER/LOWER in game
2. Optimistic update (orb spawns immediately)
3. SolanaSync submits on-chain transaction
4. On confirmation, update synced to all players
5. If tx fails, revert optimistic update

**Price Updates:**
1. SolanaSync subscribes to Pyth price feed
2. Price updates stream every ~400ms
3. PriceChart entity displays in real-time
4. On resolution, final price determines winner

**Resolution:**
1. Blockchain resolves match (price vs starting price)
2. SolanaSync detects status change
3. Game transitions to Results scene
4. Winners can claim on-chain

## Visual Features

### Player Rendering
- Circular avatar with deterministic color
- Username above avatar
- Level badge below avatar
- Prediction icon (📈/📉) when predicted
- Emote display (3s duration)
- Chat bubble (5s duration)

### Animations
- Player movement (200 px/s)
- Orb pulsing (scale 0.9-1.1)
- Orb floating (±10px sine wave)
- Price chart smooth interpolation
- Camera smooth follow (10% smoothing)

### UI Theme
Matches FATE Protocol design:
- Primary: #a855f7 (purple)
- Secondary: #ec4899 (pink)
- Success: #10b981 (green)
- Danger: #ef4444 (red)
- Dark: #0a0a0a

## Performance

**Optimization:**
- 60 FPS target
- Interpolation for smooth movement
- Network compression enabled
- 20 Hz update rate (vs 60 FPS render)
- Price chart: max 60 data points
- Orb auto-destruction after 60s

**Network Efficiency:**
- Only send changed data
- Position updates batched
- Price feed: send last 10 points only
- Gzip compression on messages

## Spectator Mode

**Features:**
- Join match without paying entry fee
- `isSpectator: true` flag on Player
- Cannot make predictions
- Can chat and use emotes
- Free camera movement
- Max 50 spectators per match

**UI:**
- Spectator badge on avatar
- Spectator count in match info
- Different camera behavior (free roam)

## Chat System

**Features:**
- Per-match chat rooms
- Rate limit: 1 message/second
- Max length: 200 characters
- Profanity filter enabled
- System messages (joins, leaves, events)

**Message Types:**
- `player`: User chat
- `system`: Join/leave/countdown
- `emote`: Emoji reactions

## Sound Effects (Placeholder)

Recommended sounds to add:
- `prediction.mp3` - When player predicts
- `countdown.mp3` - Timer beeps (10, 5, 3, 2, 1)
- `win.mp3` - Victory fanfare
- `lose.mp3` - Defeat sound
- `join.mp3` - Player joined
- `chat.mp3` - New message
- `emote.mp3` - Emote used

## Development Setup

1. **Install Dependencies:**
```bash
npm install moddio-engine socket.io-client @solana/web3.js
```

2. **Start Moddio Server:**
```bash
cd game
moddio start
```

3. **Run Next.js Dev:**
```bash
npm run dev
```

4. **Connect to Match:**
```typescript
const game = new FateGame(container)
await game.initialize(wallet, connection, program)
game.changeScene('lobby', { matchId, marketName, entryFee })
game.start()
```

## Future Enhancements

- [ ] Advanced UI components (health bars, power-ups)
- [ ] Particle effects for predictions
- [ ] Voice chat integration
- [ ] Replay system
- [ ] Tournament bracket visualization
- [ ] Custom player skins (NFT integration)
- [ ] Leaderboard overlay in-game
- [ ] Minimap for large arenas
- [ ] Mobile touch controls

## Status

✅ **Core architecture complete**
✅ **Entity system implemented**
✅ **Scene management ready**
✅ **Solana sync layer built**
✅ **Configuration system done**

**Ready for:**
- UI component extension
- Asset creation (sprites/sounds)
- Full Moddio server integration
- Production testing

Total: **8 files**, ~1500 lines of game engine code
