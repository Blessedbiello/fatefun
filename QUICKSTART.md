# FATE Protocol - Quick Start Guide

Get your FATE Protocol development environment up and running in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Rust** 1.75+ ([Install](https://rustup.rs/))
- **Solana CLI** 1.18+ ([Install Guide](https://docs.solana.com/cli/install-solana-cli-tools))
- **Anchor CLI** 0.30+ ([Install Guide](https://www.anchor-lang.com/docs/installation))
- **Yarn** or **npm**

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd fatefun
```

### 2. Install Dependencies

```bash
# Install root dependencies
yarn install

# Install program dependencies
cd programs/fate-protocol
yarn install

# Install frontend dependencies
cd ../../app
yarn install
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID=<your-program-id>
NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID=<your-program-id>
```

## Development Workflow

### Option 1: Full Stack Development

Run everything at once:

```bash
# From root directory
yarn dev
```

This will:
- Build and deploy Solana programs to localnet
- Start the Next.js frontend on `http://localhost:3000`

### Option 2: Component-by-Component

#### Step 1: Start Local Validator

```bash
# Terminal 1
solana-test-validator
```

#### Step 2: Build & Deploy Programs

```bash
# Terminal 2
cd programs/fate-protocol

# Build programs
anchor build

# Deploy to localnet
anchor deploy

# Copy program IDs to .env
anchor keys list
```

#### Step 3: Run Tests

```bash
# In programs/fate-protocol
anchor test --skip-local-validator
```

#### Step 4: Start Frontend

```bash
# Terminal 3
cd app
yarn dev
```

Visit `http://localhost:3000`

## First-Time Setup

### 1. Create Solana Wallet

```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Check your address
solana address

# Get devnet SOL
solana airdrop 2
```

### 2. Initialize Programs

After deploying, you need to initialize the programs:

```bash
# Using Anchor CLI
cd programs/fate-protocol

# Initialize Arena
anchor run initialize-arena

# Initialize Council
anchor run initialize-council
```

Or use the test suite:

```bash
anchor test
```

### 3. Configure Wallet in Browser

1. Install [Phantom Wallet](https://phantom.app/) or [Solflare](https://solflare.com/)
2. Import your wallet using the private key from `~/.config/solana/id.json`
3. Switch network to "Devnet"
4. Request airdrop from wallet UI

## Project Structure Overview

```
fatefun/
├── programs/fate-protocol/     # Anchor workspace
│   ├── programs/
│   │   ├── fate_arena/        # Match & prediction logic
│   │   └── fate_council/      # Governance logic
│   └── tests/                 # Program tests
├── app/                       # Next.js frontend
│   ├── app/                   # Pages (App Router)
│   ├── components/            # React components
│   ├── lib/                   # Utilities
│   ├── hooks/                 # Custom hooks
│   └── store/                 # Zustand stores
└── game/                      # Moddio game engine
    ├── scripts/               # Game logic
    └── assets/                # Game assets
```

## Common Commands

### Solana Programs

```bash
cd programs/fate-protocol

# Build
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# View program logs
solana logs <program-id>

# Get program info
anchor idl fetch <program-id>
```

### Frontend

```bash
cd app

# Development
yarn dev

# Build
yarn build

# Type check
yarn type-check

# Lint
yarn lint

# Format
yarn format
```

## Testing Your Setup

### 1. Test Smart Contracts

```bash
cd programs/fate-protocol
anchor test
```

Expected output:
```
✓ Initialize arena (523ms)
✓ Create match (412ms)
✓ Join match (389ms)
✓ Start match (445ms)
✓ Resolve match (502ms)
```

### 2. Test Frontend

1. Start the app: `cd app && yarn dev`
2. Visit `http://localhost:3000`
3. Connect your wallet
4. Check console for errors

### 3. Test Integration

1. Create a match from the UI
2. Verify transaction on [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
3. Join the match with predictions
4. Wait for match to resolve

## Troubleshooting

### Program Build Errors

**Error**: `anchor: command not found`
```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1
```

**Error**: `program failed to complete`
```bash
# Increase compute units
solana-test-validator --reset --limit 400000
```

### Frontend Errors

**Error**: `Module not found: Can't resolve '@solana/wallet-adapter-react'`
```bash
cd app
rm -rf node_modules
yarn install
```

**Error**: `Failed to fetch from RPC`
```bash
# Check your RPC endpoint
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Try alternative RPC
# Update .env with https://rpc.ankr.com/solana_devnet
```

### Wallet Connection Issues

**Error**: `Wallet not detected`
- Install wallet extension
- Refresh the page
- Enable wallet in browser settings

**Error**: `Insufficient funds`
```bash
# Airdrop SOL
solana airdrop 2

# Or use faucet
# https://solfaucet.com
```

## Next Steps

1. **Read the docs**: Check out [ARCHITECTURE.md](ARCHITECTURE.md)
2. **Explore the code**: Start with [programs/fate-protocol/programs/fate_arena/src/lib.rs](programs/fate-protocol/programs/fate_arena/src/lib.rs)
3. **Make changes**: Try modifying match parameters
4. **Run tests**: Ensure everything works
5. **Deploy**: Deploy to devnet and test with real users

## Getting Help

- **Documentation**: See [README.md](README.md)
- **Discord**: Join our community
- **GitHub Issues**: Report bugs
- **Twitter**: Follow for updates

## Useful Resources

- [Anchor Book](https://book.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Pyth Network Docs](https://docs.pyth.network/)
- [Next.js Docs](https://nextjs.org/docs)
- [Moddio Docs](https://www.modd.io/docs)

---

Happy Building! ⚔️
