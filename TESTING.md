# FATE Protocol - Testing & Deployment Guide

## Test Suite Overview

### Test Files

| File | Purpose | Coverage |
|------|---------|----------|
| `programs/fate_arena/tests/fate-arena.ts` | Arena program tests | 16 test cases |
| `programs/fate_council/tests/fate-council.ts` | Council program tests | 14 test cases |
| `tests/integration.test.ts` | End-to-end flows | 5 integration scenarios |

**Total:** 35+ test cases covering all critical paths

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Build programs
anchor build

# Start local validator (for local testing)
solana-test-validator
```

### Arena Program Tests

```bash
# Run all arena tests
cd programs/fate_arena
anchor test

# Run with logs
anchor test -- --nocapture

# Run specific test
anchor test -- --test test_name
```

**Test Coverage:**
- ✅ Arena config initialization
- ✅ Market creation with Pyth validation
- ✅ Match creation & player joining
- ✅ Match capacity limits
- ✅ Prediction submission
- ✅ Duplicate prediction prevention
- ✅ Match resolution with Pyth oracle
- ✅ Winner distribution (95% split)
- ✅ Loser claim prevention
- ✅ Match cancellation & refunds
- ✅ Player stats tracking
- ✅ XP & level progression

### Council Program Tests

```bash
# Run all council tests
cd programs/fate_council
anchor test
```

**Test Coverage:**
- ✅ Council config initialization
- ✅ Proposal creation with stake
- ✅ Insufficient stake prevention
- ✅ PASS/FAIL voting
- ✅ AMM price calculation
- ✅ Position accumulation
- ✅ Proposal resolution (pass condition)
- ✅ Proposal resolution (fail condition)
- ✅ Token claims for winners
- ✅ Loser claim prevention
- ✅ Double claim prevention
- ✅ Proposal execution
- ✅ Failed proposal execution prevention

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

**Scenarios:**
1. **Full Match Flow**: Create → Join → Predict → Resolve → Claim
2. **Concurrent Matches**: Multiple matches running simultaneously
3. **Council → Arena**: Governance creates market, match uses it
4. **Player Progression**: Stats tracked across multiple matches
5. **Stress Test**: 20 players, 3 concurrent matches

## Deployment

### Devnet Deployment

```bash
# 1. Build programs
anchor build

# 2. Deploy to devnet
npm run deploy:devnet
# or
ts-node scripts/deploy.ts

# 3. Setup test environment
npm run setup:devnet
```

**Output:**
- `deployment-devnet.json` - Program IDs, PDAs, market addresses
- Console logs with verification status

**What It Does:**
1. Builds programs
2. Deploys to devnet
3. Initializes Arena & Council configs
4. Creates initial markets (SOL/USD, BTC/USD, ETH/USD)
5. Verifies all deployments
6. Generates deployment info file

### Mainnet Deployment

```bash
# WARNING: Requires mainnet SOL and audited code

# 1. Set environment
export NETWORK=mainnet
export MAINNET_RPC_URL=your_rpc_url

# 2. Build with verification
anchor build --verifiable

# 3. Deploy
npm run deploy:mainnet
```

**Checklist:**
- [ ] Security audit completed
- [ ] Programs upgraded from devnet
- [ ] Sufficient SOL in deployer wallet (10+ SOL)
- [ ] Premium RPC endpoint configured
- [ ] Monitoring service ready
- [ ] Frontend updated with mainnet config

## Environment Setup

### Devnet

```bash
# Copy example
cp .env.devnet.example .env.devnet

# Update program IDs after deployment
# Get from deployment-devnet.json
```

### Mainnet

```bash
# Copy example
cp .env.mainnet.example .env.mainnet

# Configure:
# - Program IDs
# - Premium RPC (Helius/QuickNode)
# - Analytics tokens
# - Monitoring webhooks
```

## Monitoring

### Start Monitoring Service

```bash
# Devnet
npm run monitor:devnet

# Mainnet
npm run monitor:mainnet
```

**Features:**
- 📢 Discord notifications for:
  - New matches created
  - Matches started
  - Matches resolved (with results)
  - New proposals
  - Proposal outcomes
- 📊 Protocol metrics tracking
- 🔔 Weekly summary reports

### Configure Discord Webhook

1. Create webhook in Discord server settings
2. Add to `.env`:
   ```
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

## Testing Checklist

### Before Devnet Deployment

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Programs build without warnings
- [ ] IDL files generated
- [ ] Type definitions updated

### Before Mainnet Deployment

- [ ] Security audit completed
- [ ] Load testing (100+ concurrent users)
- [ ] Stress testing (multiple matches)
- [ ] Frontend tested on devnet
- [ ] Transaction retry logic verified
- [ ] Error handling comprehensive
- [ ] Gas optimization reviewed
- [ ] Upgrade authority configured

## Manual Testing Guide

### Test Match Flow

1. **Create Match:**
   ```bash
   # Frontend: /arena → "Create Match"
   # CLI: anchor run create-match
   ```

2. **Join Match:**
   - Open in 2+ browser tabs
   - Connect different wallets
   - Join same match

3. **Submit Predictions:**
   - Each wallet predicts HIGHER or LOWER
   - Verify optimistic UI updates

4. **Wait for Resolution:**
   - Countdown timer should update
   - Price chart shows real-time data

5. **Claim Winnings:**
   - Winners should see claim button
   - Verify SOL received

### Test Governance

1. **Create Proposal:**
   ```bash
   # Frontend: /council → "Create Proposal"
   # Stake 1 SOL
   ```

2. **Vote:**
   - Multiple wallets vote PASS/FAIL
   - Check AMM price calculation
   - Verify pool balances

3. **Resolve:**
   - Wait for voting period
   - Resolve proposal
   - Verify outcome (pass/fail)

4. **Claim:**
   - Winners claim tokens
   - Check proportional distribution

## Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable |
|--------|--------|------------|
| Match creation | < 1s | < 2s |
| Player join | < 1s | < 2s |
| Prediction submit | < 1s | < 2s |
| Match resolution | < 2s | < 5s |
| Claim winnings | < 1s | < 2s |

### Load Testing

```bash
# Test with k6 or similar
npm run load-test

# Or manually:
# - 10 concurrent matches
# - 5 players each
# - All predictions submitted
# Monitor: TX success rate, latency, errors
```

## Troubleshooting

### Common Issues

**"Insufficient funds":**
```bash
# Devnet: Request airdrop
solana airdrop 2

# Mainnet: Buy/transfer SOL
```

**"Program not found":**
```bash
# Verify deployment
solana program show <program_id>

# Check network matches
echo $NEXT_PUBLIC_SOLANA_NETWORK
```

**"Price feed error":**
- Verify Pyth feed ID matches network (devnet vs mainnet)
- Check feed is active: https://pyth.network/developers/price-feed-ids

**"Transaction timeout":**
- Increase timeout in provider config
- Use priority fees
- Check RPC endpoint health

### Debug Mode

```typescript
// In tests
const provider = anchor.AnchorProvider.env();
provider.opts.skipPreflight = false; // See full error
provider.opts.commitment = "confirmed";

// Enable logs
anchor test -- --nocapture
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: anchor build
      - run: anchor test

  deploy-devnet:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run deploy:devnet
        env:
          ANCHOR_WALLET: ${{ secrets.DEVNET_WALLET }}
```

## Next Steps

1. **Run Tests:** `anchor test`
2. **Deploy Devnet:** `npm run deploy:devnet`
3. **Setup Test Data:** `npm run setup:devnet`
4. **Start Monitor:** `npm run monitor:devnet`
5. **Test Frontend:** `npm run dev`
6. **Load Test:** Simulate concurrent users
7. **Security Audit:** External review
8. **Deploy Mainnet:** `npm run deploy:mainnet`

## Resources

- **Anchor Docs:** https://book.anchor-lang.com/testing/intro.html
- **Solana Testing:** https://docs.solana.com/developing/test-validator
- **Pyth Feeds:** https://pyth.network/developers/price-feed-ids
- **CI/CD:** https://github.com/coral-xyz/anchor/tree/master/.github/workflows

---

**Status:** ✅ Complete test suite ready for execution
**Coverage:** 35+ test cases across arena, council, and integration
**Deployment:** Automated scripts for devnet & mainnet
