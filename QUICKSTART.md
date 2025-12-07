# FATE Protocol - Quick Start Guide

## Prerequisites

- Node.js 18+
- Rust & Anchor CLI
- Solana CLI
- Git

## Project Structure

```
fatefun/
├── programs/               # Solana programs (Anchor)
│   ├── fate_arena/        # PvP prediction battles
│   └── fate_council/      # Futarchy governance
│
├── app/                   # Next.js frontend
│   ├── arena/            # Match pages
│   ├── council/          # Governance pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   └── store/            # Zustand stores
│
└── game/                  # Moddio game engine
    ├── src/              # Game source
    └── moddio.config.js  # Configuration
```

## Quick Start

See [MODDIO_ENHANCED.md](MODDIO_ENHANCED.md) for complete game engine documentation.
See [GAME_LAYOUT.md](GAME_LAYOUT.md) for visual design reference.

Built with Solana, Anchor, Next.js, and Moddio.
