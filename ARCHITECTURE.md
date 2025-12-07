# FATE Protocol - Architecture Documentation

## System Overview

FATE Protocol is a decentralized prediction markets platform built on Solana, combining competitive gaming with DeFi mechanics. The system consists of three main layers:

1. **Smart Contract Layer** (Solana/Anchor)
2. **Application Layer** (Next.js 14)
3. **Game Layer** (Moddio)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │  Next.js   │  │  Zustand   │  │  Wallet Adapter     │   │
│  │  App Router│  │   Store    │  │  (Phantom/Solflare) │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Game Engine Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │  Moddio    │  │   Price    │  │   Match             │   │
│  │   Arena    │  │  Oracle    │  │  Controller         │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Blockchain Layer (Solana)                 │
│  ┌──────────────────┐         ┌──────────────────────┐     │
│  │  fate_arena      │         │   fate_council       │     │
│  │                  │         │                      │     │
│  │  • Matches       │         │  • Proposals         │     │
│  │  • Predictions   │         │  • Voting            │     │
│  │  • Resolution    │         │  • Execution         │     │
│  └──────────────────┘         └──────────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Pyth Network Oracle                      │  │
│  │  (Real-time Price Feeds: SOL, BTC, ETH, etc.)        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Smart Contract Architecture

### Fate Arena Program

**Purpose**: Manages prediction battles and match lifecycle

**Key Accounts**:
- `Arena`: Global state for the entire protocol
- `Match`: Individual match state
- `Player`: Player statistics and progression
- `Prediction`: Player's prediction for a specific match

**State Transitions**:
```
Match Lifecycle:
Pending → Active → Ended → Resolved

Actions:
1. create_match()    → Pending
2. join_match()      → Pending (players join)
3. start_match()     → Active (price locked)
4. resolve_match()   → Ended → Resolved (winners determined)
5. claim_winnings()  → Payouts distributed
```

**Key Features**:
- Multiple market types (Direction, Target, Range)
- Pyth oracle integration for tamper-proof prices
- Automatic fee distribution
- Player statistics tracking
- Match cancellation for pending matches

### Fate Council Program

**Purpose**: Decentralized governance through futarchy

**Key Accounts**:
- `Council`: Governance parameters
- `Proposal`: Governance proposals
- `Vote`: Individual votes on proposals

**Proposal Types**:
1. `AddMarket`: Add new prediction markets
2. `UpdateFees`: Modify platform fees
3. `UpdateLimits`: Change betting limits
4. `Treasury`: Treasury fund allocation

**Voting Mechanism**:
```
Proposal Lifecycle:
Active → Voted → (Succeeded/Defeated) → Executed/Cancelled

Requirements:
- Quorum: 10% of total voting power
- Approval: 60% of votes
- Timelock: 24 hours after approval
```

## Frontend Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **State**: Zustand
- **Blockchain**: @solana/web3.js + @coral-xyz/anchor
- **Wallet**: @solana/wallet-adapter-react
- **Queries**: @tanstack/react-query

### Page Structure

```
/ (Homepage)
├── Hero Section
├── Stats Overview
├── Active Matches
└── Features

/arena (Battle Arena)
├── Match List (sidebar)
├── Game Arena (main)
└── Create Match (modal)

/governance (DAO Dashboard)
├── Governance Stats
├── Proposal List
└── Voting Interface

/profile (Player Profile)
├── Player Stats
├── Match History
└── Achievements
```

### State Management

**Zustand Stores**:

1. **useMatchStore**
   - Active matches
   - Selected match
   - Match updates

2. **usePlayerStore**
   - Player statistics
   - Win/loss record
   - Level & XP

3. **useGovernanceStore**
   - Proposals
   - Voting power
   - Vote history

### Data Flow

```
User Action → Component → Hook → Program Call → Transaction
                ↓                                     ↓
            State Update ←────── Event Listener ←─────┘
```

## Game Engine Integration

### Moddio Architecture

**Components**:
1. **Match Controller**: Synchronizes game state with blockchain
2. **Price Oracle**: Fetches live prices from Pyth
3. **Player System**: Manages avatars and interactions

**Game Flow**:
```
1. Player joins match on-chain
2. Game creates player avatar in arena
3. Price updates stream from Pyth
4. Visual indicators show predictions
5. Countdown timer synchronizes with blockchain
6. Match resolves on-chain
7. Victory animation triggers for winners
8. Redirect to claim winnings
```

## Security Considerations

### Smart Contracts
- ✅ PDA validation on all instructions
- ✅ Signer checks for sensitive operations
- ✅ Math overflow protection
- ✅ State validation before transitions
- ✅ Oracle staleness checks
- ⚠️ Requires professional audit before mainnet

### Frontend
- ✅ Wallet signature required for all transactions
- ✅ Transaction simulation before execution
- ✅ Environment variable validation
- ✅ Input sanitization

## Performance Optimization

### Blockchain
- Batch account fetches with `getMultipleAccounts`
- Use WebSocket subscriptions for real-time updates
- Implement account caching with expiry
- Optimize transaction size

### Frontend
- Next.js App Router for automatic code splitting
- Image optimization with Next/Image
- React Query for data caching
- Lazy load game engine components

### Game Engine
- Asset preloading
- Object pooling for frequently created entities
- Reduce network calls with state batching
- Optimize sprite rendering

## Deployment Strategy

### Development
```
Solana: Localnet
Frontend: localhost:3000
Game: Development mode
```

### Staging (Devnet)
```
Solana: Devnet
Frontend: Vercel preview
Game: Test server
Pyth: Devnet feeds
```

### Production (Mainnet)
```
Solana: Mainnet-beta
Frontend: Vercel production
Game: Production server
Pyth: Mainnet feeds
CDN: Cloudflare
Monitoring: Datadog/Sentry
```

## Monitoring & Analytics

### On-Chain Metrics
- Total matches created
- Total volume traded
- Active users
- Win rates by market type

### Frontend Metrics
- Page views
- Wallet connections
- Transaction success rate
- User retention

### Game Metrics
- Concurrent players
- Average match duration
- Server latency
- Client FPS

## Future Enhancements

### Phase 2
- [ ] Token launch (FATE token)
- [ ] Staking mechanism
- [ ] Tournament mode
- [ ] Leaderboard rewards

### Phase 3
- [ ] Cross-chain support
- [ ] Mobile app (React Native)
- [ ] Advanced charting tools
- [ ] Social features (teams, clans)

### Phase 4
- [ ] AI-powered predictions
- [ ] Prediction marketplace
- [ ] Creator tools for custom markets
- [ ] Integration with other DeFi protocols

## API Reference

### Anchor Programs

**fate_arena**
- `initialize(params)` - Initialize arena
- `create_match(params)` - Create new match
- `join_match(params)` - Join and predict
- `start_match()` - Start match
- `resolve_match()` - Resolve with oracle
- `claim_winnings()` - Claim rewards

**fate_council**
- `initialize_council(params)` - Initialize governance
- `create_proposal(params)` - Create proposal
- `cast_vote(params)` - Vote on proposal
- `execute_proposal()` - Execute approved proposal

### Frontend Hooks

**useProgram**
- `useFateArenaProgram()` - Get arena program instance
- `useFateCouncilProgram()` - Get council program instance

**usePyth**
- `usePythPrice(feedAddress)` - Subscribe to price feed

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - See [LICENSE](LICENSE) for details.
