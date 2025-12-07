# FATE Protocol

**Real-Time PvP Prediction Battle Game on Solana**

FATE Protocol is a revolutionary prediction markets platform that combines DeFi with competitive gaming. Players battle in real-time by predicting cryptocurrency price movements, powered by Pyth Network oracles and governed by the community through futarchy.

## Features

- **Real-Time PvP Battles**: Compete against other players in live prediction markets
- **Pyth Oracle Integration**: Accurate, tamper-proof price feeds from Pyth Network
- **Community Governance**: Decentralized decision-making through the FATE Council
- **Multiple Market Types**: Price direction, price targets, and price ranges
- **Moddio Game Engine**: Immersive multiplayer arena experience
- **Player Progression**: Level up, unlock achievements, and climb the leaderboard

## Tech Stack

- **Blockchain**: Solana (Anchor Framework)
- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: Zustand
- **Wallet Integration**: Solana Wallet Adapter (Phantom, Solflare, Backpack)
- **Price Feeds**: Pyth Network
- **Game Engine**: Moddio
- **Query Management**: TanStack Query

## Project Structure

```
fatefun/
├── programs/fate-protocol/          # Solana Programs
│   ├── programs/
│   │   ├── fate_arena/              # Arena program (matches, predictions)
│   │   └── fate_council/            # Governance program
│   ├── tests/                       # Program tests
│   └── Anchor.toml                  # Anchor configuration
├── app/                             # Next.js Frontend
│   ├── app/                         # App Router pages
│   │   ├── arena/                   # Battle arena
│   │   ├── governance/              # Governance dashboard
│   │   └── profile/                 # Player profile
│   ├── components/                  # React components
│   ├── lib/                         # Utilities and helpers
│   ├── hooks/                       # React hooks
│   ├── store/                       # Zustand stores
│   └── public/                      # Static assets
├── game/                            # Moddio Game Engine
│   ├── assets/                      # Game assets
│   ├── scripts/                     # Game logic
│   └── scenes/                      # Game scenes
└── tests/                           # Integration tests
```

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.75+
- Solana CLI 1.18+
- Anchor CLI 0.30+
- Yarn or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fatefun.git
cd fatefun
```

2. Install dependencies:
```bash
yarn install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration

### Development

#### Build Solana Programs

```bash
cd programs/fate-protocol
anchor build
```

#### Run Tests

```bash
anchor test
```

#### Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

#### Run Frontend

```bash
cd app
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contracts

### Fate Arena Program

Handles all match-related functionality:

- `initialize`: Initialize the global arena
- `create_match`: Create a new prediction match
- `join_match`: Join a match and make a prediction
- `start_match`: Start the match and record entry price
- `resolve_match`: Resolve match using Pyth price feed
- `claim_winnings`: Claim winnings from a won match
- `cancel_match`: Cancel a pending match

### Fate Council Program

Handles governance and futarchy:

- `initialize_council`: Initialize the governance council
- `create_proposal`: Create a new proposal
- `cast_vote`: Vote on a proposal
- `execute_proposal`: Execute an approved proposal
- `cancel_proposal`: Cancel a proposal

## Frontend Architecture

### App Router Structure

- `/` - Landing page with hero, stats, and active matches
- `/arena` - Battle arena with match list and game integration
- `/governance` - Governance dashboard for proposals and voting
- `/profile` - Player profile with stats and match history

### State Management

Uses Zustand for global state:

- `useMatchStore`: Match state and operations
- `usePlayerStore`: Player stats and progression
- `useGovernanceStore`: Governance proposals and voting

### Wallet Integration

Supports multiple Solana wallets:
- Phantom
- Solflare
- Backpack

## Game Integration

The Moddio game engine provides real-time multiplayer functionality:

1. **Match Controller**: Manages game state synchronized with blockchain
2. **Price Oracle**: Fetches real-time prices from Pyth Network
3. **Player System**: Handles player positions and interactions

See [game/README.md](game/README.md) for more details.

## Environment Variables

See [.env.example](.env.example) for all required environment variables.

Key variables:
- `NEXT_PUBLIC_SOLANA_NETWORK`: Solana network (devnet/mainnet-beta)
- `NEXT_PUBLIC_RPC_ENDPOINT`: Solana RPC endpoint
- `NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID`: Arena program ID
- `NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID`: Council program ID
- `NEXT_PUBLIC_PYTH_*`: Pyth price feed addresses

## Testing

```bash
# Test Solana programs
cd programs/fate-protocol
anchor test

# Test frontend
cd app
yarn test

# Type check
yarn type-check

# Lint
yarn lint
```

## Deployment

### Deploy Programs

```bash
# Devnet
anchor deploy --provider.cluster devnet

# Mainnet
anchor deploy --provider.cluster mainnet
```

### Deploy Frontend

```bash
cd app
yarn build
# Deploy to Vercel, Netlify, or your hosting provider
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## Security

- All smart contracts should be audited before mainnet deployment
- Report security issues to security@fateprotocol.com

## License

MIT License - see [LICENSE](LICENSE) for details

## Links

- Website: https://fateprotocol.com
- Twitter: https://twitter.com/fateprotocol
- Discord: https://discord.gg/fateprotocol
- Documentation: https://docs.fateprotocol.com

## Acknowledgments

- Solana Foundation
- Pyth Network
- Anchor Framework
- Moddio Game Engine
- shadcn/ui

---

Built with ⚔️ by the FATE Protocol team
