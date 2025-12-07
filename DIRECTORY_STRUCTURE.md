# FATE Protocol - Complete Directory Structure

```
fatefun/
│
├── 📄 Configuration Files
│   ├── Anchor.toml                    # Anchor workspace config
│   ├── package.json                   # Root package.json
│   ├── tsconfig.json                  # Root TypeScript config
│   ├── .env.example                   # Environment template
│   ├── .gitignore                     # Git ignore rules
│   │
│   └── 📚 Documentation
│       ├── README.md                  # Main documentation
│       ├── ARCHITECTURE.md            # System architecture
│       ├── QUICKSTART.md             # Quick start guide
│       ├── PROJECT_SUMMARY.md        # Project summary
│       └── DIRECTORY_STRUCTURE.md    # This file
│
├── 🔗 programs/fate-protocol/         # Solana Programs (Anchor)
│   ├── Cargo.toml                     # Rust workspace
│   ├── package.json                   # Test dependencies
│   ├── tsconfig.json                  # Test TypeScript config
│   │
│   ├── programs/
│   │   │
│   │   ├── fate_arena/                # Arena Program
│   │   │   ├── Cargo.toml
│   │   │   ├── Xargo.toml
│   │   │   └── src/
│   │   │       ├── lib.rs             # Program entrypoint
│   │   │       ├── constants.rs       # Constants & config
│   │   │       ├── errors.rs          # Error definitions
│   │   │       │
│   │   │       ├── state/             # Account structures
│   │   │       │   ├── mod.rs
│   │   │       │   ├── arena.rs       # Global arena state
│   │   │       │   ├── match_account.rs # Match state
│   │   │       │   ├── player.rs      # Player stats
│   │   │       │   └── prediction.rs  # Prediction state
│   │   │       │
│   │   │       ├── instructions/      # Program instructions
│   │   │       │   ├── mod.rs
│   │   │       │   ├── initialize.rs
│   │   │       │   ├── create_match.rs
│   │   │       │   ├── join_match.rs
│   │   │       │   ├── start_match.rs
│   │   │       │   ├── resolve_match.rs
│   │   │       │   ├── claim_winnings.rs
│   │   │       │   ├── cancel_match.rs
│   │   │       │   └── update_stats.rs
│   │   │       │
│   │   │       └── utils/             # Helper functions
│   │   │           ├── mod.rs
│   │   │           ├── math.rs        # Math operations
│   │   │           └── validation.rs   # Validation helpers
│   │   │
│   │   └── fate_council/              # Governance Program
│   │       ├── Cargo.toml
│   │       ├── Xargo.toml
│   │       └── src/
│   │           ├── lib.rs             # Program entrypoint
│   │           ├── constants.rs
│   │           ├── errors.rs
│   │           │
│   │           ├── state/
│   │           │   ├── mod.rs
│   │           │   ├── council.rs     # Council state
│   │           │   ├── proposal.rs    # Proposal state
│   │           │   └── vote.rs        # Vote state
│   │           │
│   │           └── instructions/
│   │               ├── mod.rs
│   │               ├── initialize_council.rs
│   │               ├── create_proposal.rs
│   │               ├── cast_vote.rs
│   │               ├── execute_proposal.rs
│   │               └── cancel_proposal.rs
│   │
│   └── tests/                         # Anchor tests
│
├── 🎨 app/                            # Next.js 14 Frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── .eslintrc.json
│   │
│   ├── app/                           # App Router Pages
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Homepage
│   │   ├── globals.css                # Global styles
│   │   │
│   │   ├── arena/
│   │   │   └── page.tsx               # Battle arena page
│   │   │
│   │   ├── governance/
│   │   │   └── page.tsx               # Governance page
│   │   │
│   │   ├── profile/
│   │   │   └── page.tsx               # Profile page
│   │   │
│   │   └── api/                       # API routes
│   │
│   ├── components/                    # React Components
│   │   ├── providers.tsx              # App providers
│   │   │
│   │   ├── ui/                        # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   │
│   │   ├── home/                      # Home components
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   ├── stats.tsx
│   │   │   └── active-matches.tsx
│   │   │
│   │   ├── arena/                     # Arena components
│   │   │   ├── match-list.tsx
│   │   │   ├── create-match.tsx
│   │   │   └── game-arena.tsx
│   │   │
│   │   ├── governance/                # Governance components
│   │   │   ├── proposal-list.tsx
│   │   │   ├── create-proposal.tsx
│   │   │   └── governance-stats.tsx
│   │   │
│   │   └── profile/                   # Profile components
│   │       ├── player-stats.tsx
│   │       ├── match-history.tsx
│   │       └── achievements.tsx
│   │
│   ├── lib/                           # Utilities
│   │   ├── utils.ts                   # Helper functions
│   │   └── anchor/
│   │       └── setup.ts               # Anchor setup & PDAs
│   │
│   ├── hooks/                         # Custom Hooks
│   │   ├── useProgram.ts              # Program hooks
│   │   └── usePyth.ts                 # Pyth oracle hook
│   │
│   ├── store/                         # Zustand Stores
│   │   ├── useMatchStore.ts           # Match state
│   │   ├── usePlayerStore.ts          # Player state
│   │   └── useGovernanceStore.ts      # Governance state
│   │
│   ├── public/                        # Static assets
│   └── styles/                        # Additional styles
│
├── 🎮 game/                           # Moddio Game Engine
│   ├── README.md                      # Game documentation
│   ├── game.config.json               # Game configuration
│   │
│   ├── scripts/                       # Game logic (TypeScript)
│   │   ├── matchController.ts         # Match state controller
│   │   └── priceOracle.ts             # Price feed integration
│   │
│   ├── assets/                        # Game assets
│   │   ├── sprites/                   # Character sprites
│   │   ├── sounds/                    # Sound effects
│   │   └── music/                     # Background music
│   │
│   └── scenes/                        # Game scenes
│       ├── lobby.json                 # Pre-match lobby
│       ├── arena.json                 # Battle arena
│       └── results.json               # Match results
│
├── 📝 scripts/                        # Build & deploy scripts
└── 🧪 tests/                          # Integration tests

```

## Key File Descriptions

### Smart Contracts

| File | Purpose |
|------|---------|
| `fate_arena/src/lib.rs` | Main arena program with all instructions |
| `fate_arena/src/state/match_account.rs` | Match state machine and market types |
| `fate_arena/src/instructions/resolve_match.rs` | Pyth oracle integration for resolution |
| `fate_council/src/lib.rs` | Governance program with futarchy |
| `fate_council/src/state/proposal.rs` | Proposal types and lifecycle |

### Frontend

| File | Purpose |
|------|---------|
| `app/app/layout.tsx` | Root layout with providers |
| `app/components/providers.tsx` | Wallet adapter & query client setup |
| `app/lib/anchor/setup.ts` | Anchor program initialization & PDAs |
| `app/store/useMatchStore.ts` | Global match state management |
| `app/hooks/usePyth.ts` | Real-time price feed subscription |

### Game Engine

| File | Purpose |
|------|---------|
| `game/scripts/matchController.ts` | Syncs game state with blockchain |
| `game/scripts/priceOracle.ts` | Fetches Pyth prices for game UI |
| `game/game.config.json` | Moddio game configuration |

### Configuration

| File | Purpose |
|------|---------|
| `Anchor.toml` | Anchor workspace & program IDs |
| `.env.example` | Environment variables template |
| `tailwind.config.js` | TailwindCSS theme configuration |

## Total Files Created: 60+

### Breakdown
- **Rust Files (.rs)**: 25 files
- **TypeScript/TSX (.ts/.tsx)**: 30+ files
- **Configuration (.toml/.json)**: 10+ files
- **Documentation (.md)**: 5 files

## Key Directories

### 🔗 Smart Contracts (`programs/fate-protocol/`)
Complete Anchor workspace with two programs, full state management, and comprehensive error handling.

### 🎨 Frontend (`app/`)
Next.js 14 App Router with wallet integration, state management, and modern UI components.

### 🎮 Game Engine (`game/`)
Moddio integration with blockchain-synchronized match controller and real-time price feeds.

---

**Status**: ✅ Complete project scaffold ready for development
