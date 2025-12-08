# FATE Protocol - Quick Start Guide

Complete guide to getting FATE Protocol running in 5 minutes.

## Prerequisites

```bash
# Required installations
node >= 18.0.0
yarn >= 1.22.0
solana-cli >= 1.16.0
anchor >= 0.29.0
```

## Installation

```bash
# Clone and install
git clone <repo>
cd fatefun
npm install

# Configure Solana CLI (devnet)
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2
```

## Step 1: Build Programs

```bash
# Build all Solana programs
npm run build

# Verify build succeeded
ls -la target/deploy/
# Should see: fate_arena.so, fate_council.so
```

## Step 2: Run Tests

```bash
# Run all tests (35+ test cases)
npm run test:all

# Or run individually:
npm run test:arena        # 16 Arena tests
npm run test:council      # 14 Council tests
npm run test:integration  # 5 Integration scenarios
```

**Expected Output:**
```
✅ Arena Tests: 16 passing
✅ Council Tests: 14 passing
✅ Integration Tests: 5 passing
Total: 35 passing
```

## Step 3: Deploy to Devnet

```bash
# Deploy programs and initialize configs
npm run deploy:devnet
```

**This will:**
1. Build programs
2. Deploy to devnet
3. Initialize Arena & Council configs
4. Create 3 markets (SOL/USD, BTC/USD, ETH/USD)
5. Generate `deployment-devnet.json` with all addresses

**Output Example:**
```json
{
  "network": "devnet",
  "timestamp": "2025-12-08T...",
  "programs": {
    "arena": "8x...",
    "council": "9y..."
  },
  "pdas": {
    "arenaConfig": "Ax...",
    "councilConfig": "By...",
    "markets": {
      "SOL/USD": "Cz...",
      "BTC/USD": "Dw...",
      "ETH/USD": "Ev..."
    }
  }
}
```

## Step 4: Update Environment Variables

```bash
# Copy example env file
cp .env.devnet.example .env.local

# Update with your deployed program IDs
nano .env.local
```

**Update these values from `deployment-devnet.json`:**
```bash
NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID=<from deployment-devnet.json>
NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID=<from deployment-devnet.json>
NEXT_PUBLIC_ARENA_CONFIG_PDA=<from deployment-devnet.json>
```

## Step 5: Setup Test Data (Optional)

```bash
# Create test matches and player profiles
npm run setup:devnet
```

**This creates:**
- 10 test wallets (with 2 SOL each)
- 3 test matches with players
- 5 player profiles with simulated stats

## Step 6: Start Frontend

```bash
# Start Next.js development server
npm run dev

# Open browser
open http://localhost:3000
```

**Available Routes:**
- `/arena` - Match browser and battle arena
- `/council` - Governance proposals
- `/profile` - Player stats and achievements
- `/leaderboard` - Top players

## Step 7: Start Monitoring (Optional)

```bash
# In a separate terminal
npm run monitor:devnet
```

**Configure Discord Notifications:**
```bash
# Add to .env.local
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

**Monitoring Features:**
- 🎮 New matches created
- ⚔️ Matches started
- 🏆 Match results
- 🗳️ New proposals
- ✅ Proposal outcomes

## Testing the App

### Create Your First Match

1. Open http://localhost:3000/arena
2. Connect wallet (use Phantom or Solflare on devnet)
3. Click "Create Match"
4. Fill form:
   - Market: SOL/USD
   - Entry Fee: 0.1 SOL
   - Max Players: 5
   - Duration: 300s
5. Click "Create Match"

### Join and Play

1. **Join Match:**
   - Browse open matches
   - Click "Join Match"
   - Pay entry fee

2. **Submit Prediction:**
   - Click HIGHER or LOWER
   - Confirm transaction

3. **Watch Live:**
   - Real-time price chart updates
   - Countdown timer
   - Player predictions shown

4. **Claim Winnings:**
   - After match resolves
   - Winners see "Claim" button
   - Receive 95% of pool proportionally

## Common Commands

```bash
# Testing
npm run test              # Run all tests
npm run test:arena        # Arena program tests
npm run test:council      # Council program tests
npm run test:integration  # Integration tests
npm run test:all          # All tests sequentially

# Building
npm run build             # Build all programs
npm run build:verify      # Verifiable build
npm run build:frontend    # Build Next.js app

# Deployment
npm run deploy:devnet     # Deploy to devnet
npm run deploy:mainnet    # Deploy to mainnet (requires audit!)
npm run setup:devnet      # Create test data

# Monitoring
npm run monitor:devnet    # Monitor devnet
npm run monitor:mainnet   # Monitor mainnet

# Local Development
npm run dev               # Start frontend
npm run localnet          # Start local validator
npm run logs              # View Solana logs
npm run airdrop           # Request SOL airdrop
npm run balance           # Check wallet balance

# Frontend
npm run lint              # Lint frontend code
npm run type-check        # TypeScript type checking
npm run format            # Format all files

# Deployment
npm run vercel:deploy     # Deploy to production
npm run vercel:preview    # Deploy preview
```

## Solana CLI Helpers

```bash
# Check your balance
solana balance

# Request airdrop (devnet only)
solana airdrop 2

# View program info
solana program show <PROGRAM_ID>

# View account data
solana account <ACCOUNT_ADDRESS>

# Watch logs (useful during testing)
solana logs
```

## Troubleshooting

### "Insufficient funds"
```bash
# Devnet: Request airdrop
solana airdrop 2

# Check balance
solana balance
```

### "Program not found"
```bash
# Verify program is deployed
solana program show <PROGRAM_ID>

# Check you're on correct network
solana config get
```

### "Price feed error"
- Verify Pyth feed IDs match network (devnet vs mainnet)
- Check feed is active: https://pyth.network/developers/price-feed-ids

### "Transaction timeout"
```bash
# Increase commitment in Anchor.toml
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[programs.devnet]
# Add timeout options in provider config
```

### Tests failing
```bash
# Clean and rebuild
npm run clean
npm run build
npm run test
```

## Project Structure

```
fatefun/
├── programs/
│   ├── fate_arena/          # PvP prediction battles
│   │   ├── src/lib.rs       # Program logic
│   │   └── tests/           # Anchor tests
│   └── fate_council/        # Futarchy governance
│       ├── src/lib.rs
│       └── tests/
├── app/                     # Next.js frontend
│   ├── arena/               # Match pages
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   └── lib/                 # Utilities
├── scripts/
│   ├── deploy.ts            # Deployment automation
│   ├── setup-devnet.ts      # Test data creation
│   └── monitor.ts           # Event monitoring
├── tests/
│   └── integration.test.ts  # E2E tests
└── game/                    # Modd.io game client
```

## Environment Files

- `.env.devnet.example` - Devnet configuration template
- `.env.mainnet.example` - Mainnet configuration template
- `.env.local` - Your local config (git-ignored)

## Documentation

- [TESTING.md](TESTING.md) - Complete testing guide
- [FRONTEND_IMPLEMENTATION.md](FRONTEND_IMPLEMENTATION.md) - Frontend setup
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview

## Next Steps

1. ✅ Run tests: `npm run test:all`
2. ✅ Deploy to devnet: `npm run deploy:devnet`
3. ✅ Setup test data: `npm run setup:devnet`
4. ✅ Start frontend: `npm run dev`
5. ✅ Create first match
6. 📊 Monitor events: `npm run monitor:devnet`
7. 🎮 Integrate Modd.io game client
8. 🔒 Security audit
9. 🚀 Deploy to mainnet

## Getting Help

- **Documentation:** Check TESTING.md and other docs/
- **Issues:** Open GitHub issue
- **Discord:** Join FATE Protocol community
- **Solana Docs:** https://docs.solana.com
- **Anchor Docs:** https://book.anchor-lang.com

## Production Deployment Checklist

Before deploying to mainnet:

- [ ] All tests passing (35+ tests)
- [ ] Security audit completed
- [ ] Load testing (100+ concurrent users)
- [ ] Frontend tested thoroughly on devnet
- [ ] Premium RPC configured (Helius/QuickNode)
- [ ] Monitoring service running
- [ ] Error tracking (Sentry) configured
- [ ] Analytics integrated
- [ ] Upgrade authority configured
- [ ] 10+ SOL in deployer wallet
- [ ] Emergency procedures documented
- [ ] Team trained on operations

---

**Status:** ✅ Complete testing & deployment infrastructure ready

**Test Coverage:** 35+ test cases (Arena: 16, Council: 14, Integration: 5)

**Deployment:** Fully automated for devnet & mainnet

**Monitoring:** Real-time Discord notifications

**Ready to build the future of prediction markets!** 🎮⚔️🏆
