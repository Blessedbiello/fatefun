# FATE Protocol - Testing Workflow Guide

Complete workflow for testing, deployment, and monitoring of FATE Protocol.

## Project Structure

```
fatefun/
├── programs/
│   ├── fate-protocol/              # Main Anchor workspace
│   │   └── programs/
│   │       ├── fate_arena/         # Arena program source (Rust)
│   │       └── fate_council/       # Council program source (Rust)
│   ├── fate_arena/                 # Arena test workspace
│   │   └── tests/
│   │       └── fate-arena.ts       # 16 Arena tests
│   └── fate_council/               # Council test workspace
│       └── tests/
│           └── fate-council.ts     # 14 Council tests
├── tests/
│   └── integration.test.ts         # 5 Integration tests
├── scripts/
│   ├── deploy.ts                   # Deployment automation
│   ├── setup-devnet.ts             # Test environment setup
│   ├── monitor.ts                  # Real-time monitoring
│   └── verify-setup.sh             # Setup verification
└── app/                            # Next.js frontend
```

## Prerequisites

### 1. Install Required Tools

```bash
# Node.js (v18+)
node --version  # Should be >= 18.0.0

# Solana CLI
solana --version  # Should be >= 1.16.0

# Anchor
anchor --version  # Should be >= 0.29.0

# Rust
cargo --version  # Should be >= 1.70.0
```

### 2. Configure Solana

```bash
# Set network to devnet
solana config set --url devnet

# Generate or use existing wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Request airdrop (devnet only)
solana airdrop 2

# Verify balance
solana balance  # Should show > 0 SOL
```

### 3. Install Dependencies

```bash
# Install all npm dependencies
npm install

# Verify setup
./scripts/verify-setup.sh
```

## Workflow: Local Development

### Step 1: Build Programs

```bash
# Build all Solana programs
npm run build

# Expected output:
# ✅ Built fate_arena.so
# ✅ Built fate_council.so
```

**Verify build:**
```bash
ls -la target/deploy/
# Should see: fate_arena.so, fate_council.so
```

### Step 2: Run Unit Tests

#### Arena Program Tests (16 test cases)

```bash
npm run test:arena
```

**Tests:**
- ✅ Initialize arena config
- ✅ Create market with valid Pyth feed
- ✅ Create market fails with invalid feed
- ✅ Create match and auto-join creator
- ✅ Join match up to max players
- ✅ Join match fails when full
- ✅ Submit prediction within window
- ✅ Submit prediction fails after window
- ✅ Resolve match with Pyth price
- ✅ Resolve match HIGHER wins
- ✅ Resolve match LOWER wins
- ✅ Resolve match tie (refund all)
- ✅ Claim winnings for winners
- ✅ Claim winnings fails for losers
- ✅ Cancel match refunds all
- ✅ Player stats update correctly

**Expected output:**
```
Arena Tests
  ✓ Initialize arena config (1234ms)
  ✓ Create market with valid Pyth feed (1456ms)
  ...
  16 passing (23s)
```

#### Council Program Tests (14 test cases)

```bash
npm run test:council
```

**Tests:**
- ✅ Initialize council config
- ✅ Create proposal with sufficient stake
- ✅ Create proposal fails with insufficient stake
- ✅ Trade outcome PASS updates pools
- ✅ Trade outcome FAIL updates pools
- ✅ AMM price calculation correct
- ✅ Multiple positions accumulate correctly
- ✅ Resolve proposal with PASS condition
- ✅ Resolve proposal with FAIL condition
- ✅ Claim tokens for winners
- ✅ Claim tokens fails for losers
- ✅ Double claim prevention
- ✅ Execute proposal creates market
- ✅ Execute fails for failed proposal

**Expected output:**
```
Council Tests
  ✓ Initialize council config (1234ms)
  ✓ Create proposal with sufficient stake (1456ms)
  ...
  14 passing (21s)
```

#### Integration Tests (5 scenarios)

```bash
npm run test:integration
```

**Tests:**
- ✅ Full match flow: create → join → predict → resolve → claim
- ✅ Multiple concurrent matches running simultaneously
- ✅ Council creates market, arena uses it for matches
- ✅ Player stats tracked across multiple matches
- ✅ Stress test: 20 players, 3 concurrent matches

**Expected output:**
```
Integration Tests
  ✓ Complete match from creation to resolution (32s)
  ✓ Multiple concurrent matches (45s)
  ...
  5 passing (2m 13s)
```

#### Run All Tests

```bash
npm run test:all
```

**Expected output:**
```
✅ Arena Tests: 16 passing
✅ Council Tests: 14 passing
✅ Integration Tests: 5 passing

Total: 35 passing (3m 45s)
```

### Step 3: Local Testing with Validator

For testing with local validator (faster, no rate limits):

```bash
# Terminal 1: Start local validator
npm run localnet

# Terminal 2: Update Solana config to localnet
solana config set --url localhost

# Terminal 3: Run tests
npm run test:all
```

## Workflow: Devnet Deployment

### Step 1: Build and Deploy

```bash
# Deploy to devnet (builds, deploys, initializes)
npm run deploy:devnet
```

**This script:**
1. Builds programs with `anchor build`
2. Deploys to devnet
3. Initializes Arena config
4. Initializes Council config
5. Creates 3 markets (SOL/USD, BTC/USD, ETH/USD)
6. Verifies all deployments
7. Generates `deployment-devnet.json`

**Output file: `deployment-devnet.json`**
```json
{
  "network": "devnet",
  "timestamp": "2025-12-08T02:30:00.000Z",
  "programs": {
    "arena": "FATEarenaBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump",
    "council": "FATEcouncBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump"
  },
  "pdas": {
    "arenaConfig": "8x7y6z...",
    "councilConfig": "9w8v7u...",
    "markets": {
      "SOL/USD": "Ax9y8z...",
      "BTC/USD": "Bw8v7u...",
      "ETH/USD": "Cv7u6t..."
    }
  },
  "pythFeeds": {
    "SOL/USD": "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix",
    "BTC/USD": "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J",
    "ETH/USD": "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw"
  }
}
```

### Step 2: Update Environment Variables

```bash
# Copy example env file
cp .env.devnet.example .env.local

# Edit with deployed addresses
nano .env.local
```

**Update these from `deployment-devnet.json`:**
```bash
NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID=FATEarenaBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump
NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID=FATEcouncBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump
NEXT_PUBLIC_ARENA_CONFIG_PDA=8x7y6z...
NEXT_PUBLIC_COUNCIL_CONFIG_PDA=9w8v7u...
```

### Step 3: Setup Test Data (Optional)

```bash
npm run setup:devnet
```

**This creates:**
- 10 test wallets (2 SOL each)
- 3 test matches with players
- 5 player profiles with simulated stats
- Outputs wallet keys for manual testing

**Output:**
```
👥 Creating test wallets...
   ✅ Wallet 1: 8x7y6z... (2 SOL)
   ✅ Wallet 2: 9w8v7u... (2 SOL)
   ...

🎮 Creating test matches...
   ✅ Match 1 created: SOL/USD (ID: 17339...)
      👤 Player joined: 8x7y6z...
      👤 Player joined: 9w8v7u...

📊 Creating test player profiles...
   ✅ Player profile created: TestPlayer1 (7 wins)
   ✅ Player profile created: TestPlayer2 (4 wins)
```

### Step 4: Start Monitoring

```bash
# In a separate terminal
npm run monitor:devnet
```

**Configure Discord webhook (optional):**
```bash
# Add to .env.local
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

**Monitoring events:**
- 🎮 New matches created
- ⚔️ Matches started
- 🏆 Match results with winners
- 🗳️ New governance proposals
- ✅ Proposal outcomes

**Example notification:**
```
🎮 New Match Created!

SOL/USD - A new prediction match has been created

Entry Fee: 0.10 SOL
Max Players: 5
Duration: 300s
Match ID: 17339849291...

FATE Protocol | devnet
```

### Step 5: Test Frontend

```bash
# Start Next.js dev server
npm run dev

# Open browser
open http://localhost:3000
```

**Test flow:**
1. Navigate to `/arena`
2. Connect wallet (Phantom/Solflare on devnet)
3. Browse open matches or create new one
4. Join a match
5. Submit prediction (HIGHER or LOWER)
6. Watch real-time price updates
7. Claim winnings after resolution

## Workflow: Mainnet Deployment

### Prerequisites

⚠️ **IMPORTANT: Only deploy to mainnet after:**
- [ ] Security audit completed
- [ ] All tests passing
- [ ] Load testing completed (100+ users)
- [ ] Devnet testing completed
- [ ] 10+ SOL in deployer wallet
- [ ] Premium RPC configured (Helius/QuickNode)

### Step 1: Build Verifiable

```bash
npm run build:verify
```

### Step 2: Deploy to Mainnet

```bash
# Set environment
export NETWORK=mainnet
export MAINNET_RPC_URL=https://your-premium-rpc-endpoint

# Deploy
npm run deploy:mainnet
```

### Step 3: Update Mainnet Config

```bash
cp .env.mainnet.example .env.production

# Update with mainnet addresses from deployment-mainnet.json
nano .env.production
```

### Step 4: Start Mainnet Monitoring

```bash
npm run monitor:mainnet
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test & Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH

      - name: Install Anchor
        run: |
          cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked

      - name: Install dependencies
        run: npm install

      - name: Build programs
        run: npm run build

      - name: Run tests
        run: npm run test:all

      - name: Verify setup
        run: ./scripts/verify-setup.sh

  deploy-devnet:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run deploy:devnet
        env:
          ANCHOR_WALLET: ${{ secrets.DEVNET_WALLET }}
```

## Troubleshooting

### Tests Failing

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
npm run test:all
```

### Deployment Fails

```bash
# Check Solana config
solana config get

# Check balance
solana balance

# Request airdrop (devnet only)
solana airdrop 2

# Verify programs built
ls -la target/deploy/
```

### Monitoring Not Working

```bash
# Check environment variables
echo $NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID
echo $DISCORD_WEBHOOK_URL

# Verify program deployed
solana program show $NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID

# Check RPC endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
  https://api.devnet.solana.com
```

### Price Feed Errors

**Check Pyth feed is correct for network:**

**Devnet:**
- SOL/USD: `J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix`
- BTC/USD: `HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J`
- ETH/USD: `EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw`

**Mainnet:**
- SOL/USD: `H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG`
- BTC/USD: `GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU`
- ETH/USD: `JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB`

## Performance Benchmarks

### Target Metrics

| Operation | Target | Acceptable |
|-----------|--------|------------|
| Match creation | < 1s | < 2s |
| Player join | < 1s | < 2s |
| Prediction submit | < 1s | < 2s |
| Match resolution | < 2s | < 5s |
| Claim winnings | < 1s | < 2s |

### Load Testing

```bash
# Test with multiple concurrent users
# Using k6 or Artillery

# Example: 10 concurrent matches, 5 players each
# Monitor: TX success rate, latency, errors
```

## Summary of Commands

```bash
# Setup
./scripts/verify-setup.sh    # Verify environment
npm install                   # Install dependencies

# Testing
npm run test:arena           # Arena program tests (16)
npm run test:council         # Council program tests (14)
npm run test:integration     # Integration tests (5)
npm run test:all            # All tests (35)

# Building
npm run build               # Build programs
npm run build:verify        # Verifiable build

# Deployment
npm run deploy:devnet       # Deploy to devnet
npm run deploy:mainnet      # Deploy to mainnet
npm run setup:devnet        # Create test data

# Monitoring
npm run monitor:devnet      # Monitor devnet events
npm run monitor:mainnet     # Monitor mainnet events

# Development
npm run dev                 # Start frontend
npm run localnet            # Start local validator
npm run logs                # View Solana logs

# Utilities
npm run airdrop             # Request SOL (devnet)
npm run balance             # Check wallet balance
npm run type-check          # TypeScript checking
npm run lint                # Lint code
npm run format              # Format code
npm run clean               # Clean build artifacts
```

---

**Status:** ✅ Complete testing workflow ready

**Coverage:** 35+ test cases across all programs

**Infrastructure:** Deployment, monitoring, and development tools

**Ready for production deployment!** 🚀
