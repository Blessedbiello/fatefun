# FATE Protocol

<div align="center">

**PvP Prediction Markets on Solana**

[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?logo=solana&logoColor=white)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.29.0-6B46C1)](https://www.anchor-lang.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Live Demo](http://localhost:3000) • [Documentation](#documentation) • [Architecture](#architecture)

</div>

---

## Overview

FATE Protocol transforms crypto price predictions into competitive PvP gaming. Players battle head-to-head in real-time, predicting cryptocurrency price movements with instant, provably fair settlements powered by Solana and Pyth Network oracles.

**Key Innovation:** We've merged prediction markets with competitive gaming infrastructure, creating a new category: **PvP DeFi Gaming**.

### What Makes FATE Different

- **Gaming-First Approach:** Flash Duels (1v1), Battle Royale (last standing), and Tournaments create distinct gameplay experiences
- **Real-Time Action:** Pyth Network oracles provide sub-second price updates with genuine competitive tension
- **Speed & Fairness:** Built on Solana for instant settlement. Smart contracts eliminate counterparty risk—no custody required
- **Accessible Complexity:** Simple HIGHER/LOWER predictions with strategic depth through timing and match selection
- **Social Competition:** Multiplayer mechanics, leaderboards, and reputation systems drive engagement

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FATE Protocol Stack                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Next.js 14  │  │   Tailwind   │  │  Wallet Adapter (React)  │  │
│  │  App Router  │  │   shadcn/ui  │  │  Phantom • Solflare      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  State Management: Zustand + TanStack Query                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓ RPC Calls
┌─────────────────────────────────────────────────────────────────────┐
│                        Solana Blockchain                             │
│  ┌────────────────────────┐      ┌────────────────────────┐         │
│  │   FATE Arena Program   │      │  FATE Council Program  │         │
│  │  ┌──────────────────┐  │      │  ┌──────────────────┐  │         │
│  │  │ Match Lifecycle  │  │      │  │   Governance     │  │         │
│  │  │ • Create Match   │  │      │  │ • Proposals      │  │         │
│  │  │ • Join Match     │  │      │  │ • Voting         │  │         │
│  │  │ • Submit Predict │  │      │  │ • Execution      │  │         │
│  │  │ • Resolve Match  │  │      │  └──────────────────┘  │         │
│  │  │ • Claim Winnings │  │      └────────────────────────┘         │
│  │  └──────────────────┘  │                                          │
│  └────────────────────────┘                                          │
│            ↓ Price Feeds                                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Pyth Network Oracle Integration                   │ │
│  │  SOL/USD • BTC/USD • ETH/USD • Real-time Price Updates        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Smart Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FATE Arena Program                           │
│                  (HRF68UNqq3ASruJFacsBhV7...)                    │
├─────────────────────────────────────────────────────────────────┤
│  State Accounts                                                  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐              │
│  │   Arena    │  │   Match    │  │ Player Entry │              │
│  │  (Global)  │  │ (Per Match)│  │ (Per Player) │              │
│  └────────────┘  └────────────┘  └──────────────┘              │
│                                                                  │
│  Instructions                                                    │
│  • initialize(fee_bps, min_players, max_players)                │
│  • create_match(market_id, match_type, entry_fee, deadline)     │
│  • join_match(match_id)                                         │
│  • submit_prediction(match_id, prediction_side)                 │
│  • resolve_match(match_id, pyth_price_account)                  │
│  • claim_winnings(match_id)                                     │
│  • cancel_match(match_id)                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   FATE Council Program                           │
│                  (DnseM3GuRFjz5SxgRMpWG...)                      │
├─────────────────────────────────────────────────────────────────┤
│  State Accounts                                                  │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐                    │
│  │  Council   │  │ Proposal │  │   Vote   │                    │
│  │  (Global)  │  │          │  │          │                    │
│  └────────────┘  └──────────┘  └──────────┘                    │
│                                                                  │
│  Instructions                                                    │
│  • initialize_council(quorum_threshold)                         │
│  • create_proposal(title, description, actions)                 │
│  • cast_vote(proposal_id, support)                              │
│  • execute_proposal(proposal_id)                                │
│  • cancel_proposal(proposal_id)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Match Lifecycle

```
1. CREATE MATCH
   User → Frontend → create_match() → Match PDA created
   State: Open | Entry Price: None | Players: 0

2. PLAYERS JOIN
   Users → Frontend → join_match() → Player Entry PDAs created
   State: Open | Entry Price: None | Players: 1..N

3. PREDICTIONS SUBMITTED
   Users → Frontend → submit_prediction(HIGHER/LOWER) → Entry updated
   State: Open | Entry Price: None | Predictions: Locked on-chain

4. DEADLINE PASSES
   Time → Prediction deadline reached
   State: Closed | Entry Price: Set from Pyth | No more predictions

5. MATCH RESOLVES
   Anyone → resolve_match() → Pyth Oracle → Final price → Calculate winners
   State: Resolved | Winning Side: Determined | Winners: Calculated

6. WINNERS CLAIM
   Winners → claim_winnings() → SOL transferred to winner wallets
   State: Resolved | Claimed: true | Funds: Distributed
```

---

## Features

### Game Modes

- **Flash Duel** - Quick 1v1 prediction battles with instant resolution
- **Battle Royale** - Last player standing wins the entire prize pool
- **Tournament** - Multi-round competitions with progressive difficulty

### Technical Features

- **Sub-Second Settlement** - Solana's 400ms block time enables instant payouts
- **Provably Fair** - All match logic executed on-chain, fully auditable
- **Tamper-Proof Prices** - Pyth Network provides cryptographically signed price feeds
- **Zero Custody** - Smart contracts hold funds, no centralized control
- **Multi-Wallet Support** - Phantom, Solflare, Backpack integration
- **Real-Time Updates** - TanStack Query for live match state synchronization

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | Solana (Devnet) |
| **Smart Contracts** | Anchor Framework 0.29.0 |
| **Oracles** | Pyth Network (SOL/USD, BTC/USD, ETH/USD) |
| **Frontend** | Next.js 14 (App Router), TypeScript |
| **Styling** | TailwindCSS, shadcn/ui, Radix UI |
| **State** | Zustand, TanStack Query |
| **Wallet** | Solana Wallet Adapter |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.75+
- Solana CLI 1.18+
- Anchor CLI 0.29.0
- Yarn or npm

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/fatefun.git
cd fatefun

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your Solana wallet in .env.local
```

### Development

#### Run Frontend

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

#### Build Programs

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
# Ensure you have devnet SOL
solana airdrop 2 --url devnet

# Deploy programs
anchor deploy --provider.cluster devnet

# Initialize arena and council
npm run initialize
```

---

## Project Structure

```
fatefun/
├── programs/fate-protocol/          # Solana Programs
│   ├── programs/
│   │   ├── fate_arena/              # Arena program (matches, predictions)
│   │   │   ├── src/
│   │   │   │   ├── lib.rs           # Program entrypoint
│   │   │   │   ├── instructions/    # Instruction handlers
│   │   │   │   ├── state/           # Account state structs
│   │   │   │   └── utils/           # Pyth integration, helpers
│   │   │   └── Cargo.toml
│   │   └── fate_council/            # Governance program
│   │       ├── src/
│   │       └── Cargo.toml
│   ├── tests/                       # Anchor tests
│   └── Anchor.toml                  # Anchor configuration
├── app/                             # Next.js Frontend
│   ├── app/                         # App Router pages
│   │   ├── page.tsx                 # Landing page
│   │   ├── arena/                   # Battle arena
│   │   │   ├── page.tsx             # Match list
│   │   │   └── [matchId]/           # Match detail
│   │   ├── governance/              # Governance dashboard
│   │   └── profile/                 # Player profile
│   ├── components/                  # React components
│   │   ├── arena/                   # Arena components
│   │   ├── governance/              # Governance components
│   │   ├── home/                    # Landing page sections
│   │   └── ui/                      # shadcn/ui components
│   ├── lib/                         # Utilities and helpers
│   │   ├── anchor/                  # Anchor client setup
│   │   ├── idl/                     # Program IDLs
│   │   ├── transactions/            # Transaction builders
│   │   └── utils/                   # Helper functions
│   ├── hooks/                       # React hooks
│   ├── store/                       # Zustand stores
│   └── public/                      # Static assets
├── scripts/                         # Deployment scripts
│   ├── deploy.ts                    # Deploy programs
│   └── initialize.ts                # Initialize configs
├── ARCHITECTURE.md                  # Detailed architecture docs
├── QUICK_START.md                   # Developer quickstart guide
├── TESTING.md                       # Testing guide
└── README.md                        # This file
```

---

## Smart Contracts

### Deployed Programs (Devnet)

| Program | Address |
|---------|---------|
| FATE Arena | `HRF68UNqq3ASruJFacsBhV7iQyfLF697FhjPCfLNXQxa` |
| FATE Council | `DnseM3GuRFjz5SxgRMpWGeSubkZZu8TxNrpQYTZVnFvZ` |

### Arena Program Instructions

```rust
// Initialize global arena config
pub fn initialize(
    ctx: Context<Initialize>,
    fee_bps: u16,              // Protocol fee (basis points)
    min_players: u8,           // Minimum players per match
    max_players: u8,           // Maximum players per match
) -> Result<()>

// Create a new prediction match
pub fn create_match(
    ctx: Context<CreateMatch>,
    market_id: Pubkey,         // Market identifier (e.g., SOL/USD)
    match_type: MatchType,     // FlashDuel, BattleRoyale, Tournament
    entry_fee: u64,            // Entry fee in lamports
    prediction_deadline: i64,  // Unix timestamp for prediction cutoff
    resolution_time: i64,      // Unix timestamp for match resolution
) -> Result<()>

// Join a match and lock entry fee
pub fn join_match(ctx: Context<JoinMatch>) -> Result<()>

// Submit prediction (HIGHER or LOWER)
pub fn submit_prediction(
    ctx: Context<SubmitPrediction>,
    prediction: PredictionSide,  // Higher or Lower
) -> Result<()>

// Resolve match using Pyth oracle price
pub fn resolve_match(ctx: Context<ResolveMatch>) -> Result<()>

// Claim winnings after match resolution
pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()>

// Cancel match if conditions met
pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()>
```

### State Accounts

```rust
// Global arena configuration
#[account]
pub struct Arena {
    pub authority: Pubkey,
    pub fee_bps: u16,
    pub total_matches: u64,
    pub total_volume: u64,
}

// Individual match state
#[account]
pub struct Match {
    pub market_id: Pubkey,
    pub match_type: MatchType,
    pub status: MatchStatus,         // Open, Closed, Resolved, Cancelled
    pub entry_fee: u64,
    pub prize_pool: u64,
    pub current_players: u8,
    pub max_players: u8,
    pub prediction_deadline: i64,
    pub resolution_time: i64,
    pub entry_price: Option<i64>,    // Set at prediction deadline
    pub final_price: Option<i64>,    // Set at resolution
    pub winning_side: Option<PredictionSide>,
}

// Player entry in a match
#[account]
pub struct PlayerEntry {
    pub player: Pubkey,
    pub match_account: Pubkey,
    pub prediction: Option<PredictionSide>,
    pub entry_fee_paid: u64,
    pub claimed: bool,
}
```

---

## Environment Variables

Create `.env.local` in the `app/` directory:

```bash
# Solana Network
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Program IDs
NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID=HRF68UNqq3ASruJFacsBhV7iQyfLF697FhjPCfLNXQxa
NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID=DnseM3GuRFjz5SxgRMpWGeSubkZZu8TxNrpQYTZVnFvZ

# Pyth Price Feed Accounts (Devnet)
NEXT_PUBLIC_PYTH_SOL_USD=J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix
NEXT_PUBLIC_PYTH_BTC_USD=HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J
NEXT_PUBLIC_PYTH_ETH_USD=EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw
```

---

## Testing

```bash
# Test smart contracts
cd programs/fate-protocol
anchor test

# Test frontend
cd app
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed system architecture
- [QUICK_START.md](QUICK_START.md) - Developer quickstart guide
- [TESTING.md](TESTING.md) - Comprehensive testing guide
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) - Current deployment status
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview

---

## Security

- Smart contracts deployed on Solana devnet for testing
- Formal audit required before mainnet deployment
- Report security issues to: security@fateprotocol.com

**Security Features:**
- Non-custodial: All funds held in program-derived addresses
- Permissionless: Anyone can create, join, or resolve matches
- Tamper-proof: Pyth oracles provide cryptographically signed prices
- Transparent: All match logic executed on-chain, fully auditable

---

## Roadmap

### Phase 1: Core Platform (Current)
- [x] Smart contract development
- [x] Pyth Network integration
- [x] Basic UI/UX
- [x] Wallet integration
- [x] Devnet deployment

### Phase 2: Enhanced Gaming
- [ ] Moddio game engine integration
- [ ] Advanced match types
- [ ] Player progression system
- [ ] Leaderboards and rankings

### Phase 3: Governance
- [ ] FATE token launch
- [ ] Futarchy implementation
- [ ] Community proposals
- [ ] Protocol parameter voting

### Phase 4: Mainnet
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Liquidity incentives
- [ ] Marketing and growth

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Acknowledgments

Built with:
- [Solana](https://solana.com) - High-performance blockchain
- [Pyth Network](https://pyth.network) - Real-time price oracles
- [Anchor](https://www.anchor-lang.com/) - Solana development framework
- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library

---

## Contact

- Website: [fateprotocol.com](https://fateprotocol.com)
- Twitter: [@fateprotocol](https://twitter.com/fateprotocol)
- Discord: [discord.gg/fateprotocol](https://discord.gg/fateprotocol)
- GitHub: [github.com/fateprotocol](https://github.com/fateprotocol)

---

<div align="center">

**Built with ⚔️ by the FATE Protocol Team**

*Where Prediction Meets Competition*

</div>
