# FATE Protocol - Developer Reference

Complete developer reference for FATE Protocol's testing and deployment infrastructure.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Test Suite](#test-suite)
3. [Deployment Scripts](#deployment-scripts)
4. [NPM Scripts](#npm-scripts)
5. [Environment Configuration](#environment-configuration)
6. [Program Architecture](#program-architecture)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

## Quick Reference

### Essential Commands

```bash
# First time setup
./scripts/verify-setup.sh     # Verify environment
npm install                   # Install dependencies
npm run build                 # Build programs

# Development cycle
npm run test:all             # Run all tests (35+ cases)
npm run deploy:devnet        # Deploy to devnet
npm run setup:devnet         # Create test data
npm run monitor:devnet       # Start monitoring
npm run dev                  # Start frontend

# Production
npm run test:all             # Ensure all tests pass
npm run build:verify         # Verifiable build
npm run deploy:mainnet       # Deploy to mainnet
```

### File Locations

```
📁 Tests
  ├── programs/fate_arena/tests/fate-arena.ts       (16 tests)
  ├── programs/fate_council/tests/fate-council.ts   (14 tests)
  └── tests/integration.test.ts                     (5 tests)

📁 Scripts
  ├── scripts/deploy.ts          (Deployment automation)
  ├── scripts/setup-devnet.ts    (Test environment)
  ├── scripts/monitor.ts         (Event monitoring)
  └── scripts/verify-setup.sh    (Setup verification)

📁 Documentation
  ├── QUICK_START.md            (Getting started guide)
  ├── TESTING.md                (Testing & deployment)
  ├── TESTING_WORKFLOW.md       (Complete workflow)
  └── DEVELOPER_REFERENCE.md    (This file)

📁 Config
  ├── .env.devnet.example       (Devnet template)
  ├── .env.mainnet.example      (Mainnet template)
  ├── package.json              (NPM scripts)
  └── Anchor.toml               (Anchor config)
```

## Test Suite

### Arena Program Tests (16 cases)

**File:** `programs/fate_arena/tests/fate-arena.ts`

**Test Categories:**

1. **Initialization Tests**
   - `initialize_config`: Creates arena config PDA
   - `create_market`: Creates market with Pyth feed validation

2. **Match Lifecycle Tests**
   - `create_match`: Creates match and auto-joins creator
   - `join_match`: Adds players up to max capacity
   - `join_match_full`: Prevents joining when full
   - `cancel_match`: Cancels match and refunds all players

3. **Prediction Tests**
   - `submit_prediction`: Submits HIGHER/LOWER prediction
   - `submit_prediction_late`: Prevents late predictions
   - `duplicate_prediction`: Prevents duplicate predictions

4. **Resolution Tests**
   - `resolve_match`: Resolves using Pyth oracle price
   - `resolve_match_higher`: HIGHER predictions win
   - `resolve_match_lower`: LOWER predictions win
   - `resolve_match_tie`: Tie results in full refund

5. **Claim Tests**
   - `claim_winnings`: Winners claim proportional share
   - `claim_winnings_loser`: Prevents losers from claiming

6. **Player Stats Tests**
   - `update_player_stats`: Tracks wins/losses/XP
   - `player_level_up`: Level progression (XP thresholds)

**Run command:**
```bash
npm run test:arena
```

**Expected duration:** ~25 seconds

### Council Program Tests (14 cases)

**File:** `programs/fate_council/tests/fate-council.ts`

**Test Categories:**

1. **Initialization Tests**
   - `initialize_council`: Creates council config PDA
   - `create_proposal`: Creates proposal with stake requirement

2. **Voting Tests**
   - `trade_outcome_pass`: Votes PASS, updates AMM pools
   - `trade_outcome_fail`: Votes FAIL, updates AMM pools
   - `multiple_positions`: Accumulates multiple votes per user
   - `insufficient_stake`: Prevents proposals without stake

3. **AMM Tests**
   - `price_calculation`: Verifies AMM price formula
   - `pool_updates`: Tracks pool balances correctly

4. **Resolution Tests**
   - `resolve_proposal_pass`: Resolves when pass_price < fail_price
   - `resolve_proposal_fail`: Resolves when fail_price < pass_price

5. **Claim Tests**
   - `claim_tokens`: Winners claim proportional tokens
   - `claim_tokens_loser`: Prevents losers from claiming
   - `double_claim`: Prevents claiming twice

6. **Execution Tests**
   - `execute_proposal`: Creates market on-chain
   - `execute_failed`: Prevents execution of failed proposals

**Run command:**
```bash
npm run test:council
```

**Expected duration:** ~22 seconds

### Integration Tests (5 scenarios)

**File:** `tests/integration.test.ts`

**Scenarios:**

1. **Full Match Flow**
   - Creates match → 5 players join → submit predictions
   - Wait 30s → resolve match → winners claim
   - **Duration:** ~35 seconds

2. **Concurrent Matches**
   - 3 matches created simultaneously
   - Players distributed across matches
   - All resolve and claim independently
   - **Duration:** ~45 seconds

3. **Council → Arena Flow**
   - Governance creates proposal for new market
   - Community votes PASS/FAIL
   - Proposal passes → market created
   - Arena uses new market for matches
   - **Duration:** ~40 seconds

4. **Player Progression**
   - Single player participates in 5 matches
   - Stats tracked: wins, losses, total_matches
   - XP accumulates, level increases
   - **Duration:** ~60 seconds

5. **Stress Test**
   - 20 players, 3 concurrent matches
   - All players predict, all matches resolve
   - Verify no race conditions or errors
   - **Duration:** ~90 seconds

**Run command:**
```bash
npm run test:integration
```

**Expected duration:** ~3-4 minutes

### Test Coverage Summary

| Category | Tests | Coverage |
|----------|-------|----------|
| Arena Program | 16 | Match lifecycle, predictions, resolution, claims |
| Council Program | 14 | Governance, AMM, voting, execution |
| Integration | 5 | End-to-end flows, concurrency, stress |
| **Total** | **35** | **Complete coverage** |

## Deployment Scripts

### deploy.ts

**Purpose:** Automated deployment to devnet or mainnet

**Usage:**
```bash
npm run deploy:devnet   # Deploy to devnet
npm run deploy:mainnet  # Deploy to mainnet
```

**What it does:**
1. Builds programs with `anchor build`
2. Deploys programs to network
3. Initializes Arena config PDA
4. Initializes Council config PDA
5. Creates 3 markets (SOL/USD, BTC/USD, ETH/USD)
6. Verifies all PDAs exist
7. Generates `deployment-{network}.json`

**Output file structure:**
```json
{
  "network": "devnet",
  "timestamp": "2025-12-08T...",
  "programs": {
    "arena": "FATEarena...",
    "council": "FATEcounc..."
  },
  "pdas": {
    "arenaConfig": "...",
    "councilConfig": "...",
    "markets": {
      "SOL/USD": "...",
      "BTC/USD": "...",
      "ETH/USD": "..."
    }
  },
  "pythFeeds": {
    "SOL/USD": "J83w4HKf...",
    "BTC/USD": "HovQMDrb...",
    "ETH/USD": "EdVCmQ9F..."
  }
}
```

**Environment variables:**
- `NETWORK`: "devnet" or "mainnet"
- `ANCHOR_WALLET`: Path to deployer wallet (defaults to Solana CLI wallet)

### setup-devnet.ts

**Purpose:** Create test environment on devnet

**Usage:**
```bash
npm run setup:devnet
```

**What it does:**
1. Creates 10 test wallets
2. Airdrops 2 SOL to each wallet
3. Creates 3 test matches (SOL/USD, BTC/USD, ETH/USD)
4. Simulates 3 players joining each match
5. Creates 5 player profiles with simulated stats
6. Outputs wallet keys for manual testing

**Rate limiting:**
- 1-second delay between airdrops (devnet rate limit)
- Handles airdrop failures gracefully

**Output:**
```
👥 Creating test wallets...
   ✅ Wallet 1: 8x7y6z... (2 SOL)
   ...

🎮 Creating test matches...
   ✅ Match 1 created: SOL/USD
      👤 Player joined: 8x7y6z...
      ...

📊 Creating test player profiles...
   ✅ TestPlayer1 (7 wins)
   ...
```

### monitor.ts

**Purpose:** Real-time event monitoring with Discord notifications

**Usage:**
```bash
npm run monitor:devnet    # Monitor devnet
npm run monitor:mainnet   # Monitor mainnet
```

**What it monitors:**
1. **Match Events:**
   - Match created (purple notification)
   - Match started (yellow notification)
   - Match resolved (green/red based on outcome)

2. **Proposal Events:**
   - New proposal (pink notification)
   - Proposal resolved (green/red based on outcome)

3. **Protocol Metrics:**
   - Total matches count
   - Total volume
   - Active players
   - Weekly summary (Sundays at midnight)

**Polling intervals:**
- Matches: Every 10 seconds
- Proposals: Every 15 seconds
- Metrics: Every 60 seconds

**Discord webhook setup:**
```bash
# Add to .env.local
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

**Example notification:**
```
🏆 Match Completed!

SOL/USD - HIGHER Wins!
Price moved +2.34%

Starting Price: $142.56
Final Price: $145.89
Winners: 3/5 players
Prize Pool: 0.50 SOL

FATE Protocol | devnet
```

### verify-setup.sh

**Purpose:** Verify development environment is correctly configured

**Usage:**
```bash
./scripts/verify-setup.sh
```

**Checks:**
1. Required tools (node, npm, solana, anchor, rust)
2. Project structure (directories and files)
3. Test files existence
4. Script files existence
5. Documentation files
6. Node modules installation
7. Solana configuration and wallet
8. Program builds (*.so files)
9. Package.json scripts

**Output:**
- ✅ Green checkmarks for success
- ⚠️ Yellow warnings for non-critical issues
- ❌ Red X for errors

**Exit codes:**
- `0`: All checks passed
- `1`: One or more checks failed

## NPM Scripts

### Testing Scripts

```bash
npm run test              # Run default test (anchor test)
npm run test:arena        # Run Arena program tests (16)
npm run test:council      # Run Council program tests (14)
npm run test:integration  # Run integration tests (5)
npm run test:all          # Run all tests sequentially (35)
```

### Build Scripts

```bash
npm run build             # Build all programs
npm run build:verify      # Build with verification
npm run build:frontend    # Build Next.js app
```

### Deployment Scripts

```bash
npm run deploy:devnet     # Deploy to devnet
npm run deploy:mainnet    # Deploy to mainnet
npm run setup:devnet      # Setup test environment
```

### Monitoring Scripts

```bash
npm run monitor:devnet    # Monitor devnet events
npm run monitor:mainnet   # Monitor mainnet events
```

### Frontend Scripts

```bash
npm run dev              # Start Next.js dev server
npm run start            # Start production server
npm run lint             # Lint frontend code
npm run type-check       # TypeScript type checking
```

### Utility Scripts

```bash
npm run localnet         # Start local validator
npm run logs             # View Solana logs
npm run airdrop          # Request 2 SOL airdrop
npm run balance          # Check wallet balance
npm run clean            # Clean build artifacts
npm run format           # Format all files
```

### Deployment Scripts

```bash
npm run vercel:deploy    # Deploy to Vercel production
npm run vercel:preview   # Deploy preview to Vercel
```

## Environment Configuration

### Devnet Configuration

**File:** `.env.devnet.example`

```bash
# Network
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Program IDs (from deployment-devnet.json)
NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID=FATEarena...
NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID=FATEcounc...

# Pyth Price Feeds (Devnet)
NEXT_PUBLIC_PYTH_SOL_USD_FEED=J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix
NEXT_PUBLIC_PYTH_BTC_USD_FEED=HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J
NEXT_PUBLIC_PYTH_ETH_USD_FEED=EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw

# PDAs (from deployment-devnet.json)
NEXT_PUBLIC_ARENA_CONFIG_PDA=...
NEXT_PUBLIC_COUNCIL_CONFIG_PDA=...

# Feature Flags
NEXT_PUBLIC_ENABLE_COUNCIL=true
NEXT_PUBLIC_MOCK_PRICES=false
NEXT_PUBLIC_DEBUG_MODE=true

# Monitoring
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Mainnet Configuration

**File:** `.env.mainnet.example`

```bash
# Network
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# Premium RPC (REQUIRED for production)
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
NEXT_PUBLIC_QUICKNODE_ENDPOINT=https://your-endpoint.quiknode.pro

# Pyth Price Feeds (Mainnet)
NEXT_PUBLIC_PYTH_SOL_USD_FEED=H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG
NEXT_PUBLIC_PYTH_BTC_USD_FEED=GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU
NEXT_PUBLIC_PYTH_ETH_USD_FEED=JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-...
NEXT_PUBLIC_MIXPANEL_TOKEN=...

# Error Tracking
SENTRY_DSN=https://...@sentry.io/...

# Database (for leaderboard caching)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## Program Architecture

### Arena Program

**Program ID:** `FATEarenaBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump`

**Accounts:**
- `ArenaConfig`: Global configuration PDA
- `Market`: Price feed market (SOL/USD, etc.)
- `Match`: Individual prediction match
- `PlayerState`: Player stats and progression

**Instructions:**
- `initialize_config`: Setup arena
- `create_market`: Register Pyth price feed
- `create_match`: Start new match
- `join_match`: Player joins
- `submit_prediction`: Vote HIGHER/LOWER
- `resolve_match`: Determine winner using Pyth
- `claim_winnings`: Winners claim rewards
- `cancel_match`: Cancel and refund
- `update_player_stats`: Track progression

### Council Program

**Program ID:** `FATEcouncBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump`

**Accounts:**
- `CouncilConfig`: Global configuration PDA
- `Proposal`: Governance proposal
- `Vote`: User's vote position

**Instructions:**
- `initialize_council`: Setup governance
- `create_proposal`: Create proposal (requires stake)
- `trade_outcome`: Vote PASS or FAIL (AMM)
- `resolve_proposal`: Determine outcome
- `claim_vote_tokens`: Winners claim tokens
- `execute_proposal`: Create market on-chain

**Futarchy Logic:**
- AMM pools for PASS and FAIL outcomes
- Price calculation: `price = opposite_pool / total_pool`
- Pass condition: `pass_price < fail_price`
- Winners: Those who voted for winning outcome

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: FATE Protocol CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Verify Setup
        run: ./scripts/verify-setup.sh

  test:
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - name: Install Dependencies
        run: npm install

      - name: Build Programs
        run: npm run build

      - name: Run Tests
        run: npm run test:all
        timeout-minutes: 10

  deploy-devnet:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Devnet
        run: npm run deploy:devnet
        env:
          ANCHOR_WALLET: ${{ secrets.DEVNET_WALLET }}

      - name: Setup Test Data
        run: npm run setup:devnet

  deploy-mainnet:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Mainnet
        run: npm run deploy:mainnet
        env:
          ANCHOR_WALLET: ${{ secrets.MAINNET_WALLET }}
          NETWORK: mainnet
```

## Troubleshooting

### Common Issues

#### 1. Tests Failing

**Symptoms:** Test suite fails with errors

**Solutions:**
```bash
# Clean and rebuild
npm run clean
npm install
npm run build

# Run tests with verbose output
cd programs/fate_arena && anchor test -- --nocapture
```

#### 2. Insufficient SOL

**Symptoms:** "insufficient funds" error

**Solutions:**
```bash
# Devnet: Request airdrop
solana airdrop 2

# Check balance
solana balance

# Mainnet: Transfer SOL to wallet
```

#### 3. Program Not Found

**Symptoms:** "Program not found" error

**Solutions:**
```bash
# Verify program deployed
solana program show <PROGRAM_ID>

# Check correct network
solana config get

# Redeploy if needed
npm run deploy:devnet
```

#### 4. Price Feed Error

**Symptoms:** "Invalid Pyth feed" error

**Solutions:**
- Verify using correct feed IDs for network (devnet vs mainnet)
- Check feed is active: https://pyth.network/developers/price-feed-ids
- Update `.env` with correct feed addresses

#### 5. Transaction Timeout

**Symptoms:** Transactions timing out

**Solutions:**
```bash
# Use premium RPC (mainnet)
export NEXT_PUBLIC_RPC_ENDPOINT=https://your-quicknode-endpoint

# Increase timeout in provider
# Edit Anchor.toml:
[provider]
timeout = 60000  # 60 seconds
```

### Debug Mode

Enable detailed logging:

```typescript
// In tests
const provider = anchor.AnchorProvider.env();
provider.opts.skipPreflight = false;
provider.opts.commitment = "confirmed";

// Run with logs
anchor test -- --nocapture
```

---

**Version:** 1.0.0
**Last Updated:** 2025-12-08
**Maintainer:** FATE Protocol Team

**Additional Resources:**
- [QUICK_START.md](QUICK_START.md) - Getting started guide
- [TESTING.md](TESTING.md) - Testing & deployment guide
- [TESTING_WORKFLOW.md](TESTING_WORKFLOW.md) - Complete workflow
- [Anchor Docs](https://book.anchor-lang.com)
- [Solana Docs](https://docs.solana.com)
- [Pyth Network](https://pyth.network)
