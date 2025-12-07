# FATE Arena Instructions Documentation

Complete implementation of all 9 instructions for the FATE Protocol prediction battle game.

## ✅ Implemented Instructions

### 1. **initialize_config**
**File**: [initialize_config.rs](src/instructions/initialize_config.rs)

**Purpose**: One-time initialization of global game configuration

**Accounts**:
- `config` - GameConfig PDA (init)
- `authority` - Signer, becomes the protocol authority
- `treasury` - Treasury wallet for fee collection
- `system_program`

**Params**:
- `protocol_fee_bps` - Protocol fee in basis points (max 1000 = 10%)

**Validation**:
- Protocol fee must be ≤ 10%

**Events**: `ConfigInitialized`

---

### 2. **create_market**
**File**: [create_market.rs](src/instructions/create_market.rs)

**Purpose**: Create a new trading market with Pyth price feed

**Accounts**:
- `config` - GameConfig (authority check)
- `market` - Market PDA (init)
- `pyth_price_feed` - Pyth price update account (validated)
- `authority` - Must be config authority
- `system_program`

**Params**:
- `name` - Market name (max 32 chars, e.g., "SOL/USD")
- `description` - Description (max 128 chars)

**Validation**:
- Only authority can create markets
- Pyth account must be valid PriceUpdateV2
- Name and description length checks

**Events**: `MarketCreated`

---

### 3. **create_match**
**File**: [create_match.rs](src/instructions/create_match.rs)

**Purpose**: Create a new match (creator auto-joins and pays entry fee)

**Accounts**:
- `config` - GameConfig (pause check)
- `market` - Market (must be active)
- `match_account` - Match PDA (init)
- `player_entry` - PlayerEntry PDA for creator (init)
- `user_profile` - UserProfile (init_if_needed)
- `vault` - Match escrow vault
- `creator` - Signer, pays entry fee
- `system_program`

**Params**:
- `match_type` - FlashDuel, BattleRoyale, or Tournament
- `entry_fee` - Entry fee (0.01 - 100 SOL)
- `max_players` - Max players (2-10)
- `prediction_window` - Time to make predictions (30s - 1h)
- `match_duration` - Match duration (1min - 24h)

**Validation**:
- Game not paused
- Market active
- Entry fee in range
- Valid max players (≥3 for BattleRoyale)
- Valid time windows

**Flow**:
1. Create Match with status Open
2. Create PlayerEntry for creator
3. Initialize UserProfile if new
4. Transfer entry_fee to vault
5. Increment counters

**Events**: `MatchCreated`

---

### 4. **join_match**
**File**: [join_match.rs](src/instructions/join_match.rs)

**Purpose**: Join an existing open match

**Accounts**:
- `match_account` - Match (must be Open, not full)
- `player_entry` - PlayerEntry PDA (init)
- `user_profile` - UserProfile (init_if_needed)
- `vault` - Match escrow
- `player` - Signer, pays entry fee
- `system_program`

**Validation**:
- Match status = Open
- Match not full

**Flow**:
1. Create PlayerEntry
2. Initialize UserProfile if new
3. Transfer entry_fee to vault
4. Increment player count
5. If match full → status = InProgress

**Events**: `PlayerJoined`

---

### 5. **submit_prediction**
**File**: [submit_prediction.rs](src/instructions/submit_prediction.rs)

**Purpose**: Submit Higher/Lower prediction for a match

**Accounts**:
- `market` - Market with Pyth feed
- `match_account` - Match (Open or InProgress)
- `player_entry` - PlayerEntry (prediction not locked)
- `price_update` - Pyth PriceUpdateV2 account
- `player` - Signer

**Params**:
- `prediction` - PredictionSide::Higher or Lower

**Validation**:
- Within prediction window
- Prediction not already locked
- Pyth price not stale (< 60s old)

**Flow**:
1. Check prediction deadline
2. Fetch current price from Pyth
3. If first prediction → set start_price, status = InProgress
4. Lock player's prediction with timestamp

**Events**: `PredictionSubmitted`

---

### 6. **resolve_match**
**File**: [resolve_match.rs](src/instructions/resolve_match.rs)

**Purpose**: Resolve match outcome using Pyth oracle

**Accounts**:
- `config` - GameConfig
- `market` - Market
- `match_account` - Match (InProgress, past resolution_time)
- `price_update` - Pyth PriceUpdateV2
- `resolver` - Anyone can call

**Validation**:
- Match status = InProgress
- Current time ≥ resolution_time
- Pyth price not stale

**Flow**:
1. Fetch end_price from Pyth
2. Compare to start_price
3. Determine winning_side (Higher/Lower)
4. If prices equal, Higher wins
5. Update status = Completed
6. Update global volume stats

**Events**: `MatchResolved`

---

### 7. **claim_winnings**
**File**: [claim_winnings.rs](src/instructions/claim_winnings.rs)

**Purpose**: Claim winnings and update player stats

**Accounts**:
- `config` - GameConfig
- `match_account` - Match (Completed)
- `player_entry` - PlayerEntry (not claimed)
- `user_profile` - UserProfile (mutable)
- `vault` - Match escrow
- `treasury` - Fee collection
- `player` - Signer
- `system_program`

**Remaining Accounts**: All PlayerEntry accounts (to count winners)

**Validation**:
- Match completed
- Not already claimed

**Flow**:
1. Check if player won (prediction == winning_side)
2. Count total winners from remaining_accounts
3. Calculate protocol fee (3%)
4. Calculate per-winner payout
5. Update player stats:
   - Increment matches_played
   - Increment wins/losses
   - Update total_wagered/total_won
   - Calculate XP (200 base for win, 100 for loss)
   - Add streak bonus XP
   - Update streak counter
   - Recalculate level
6. Transfer winnings to player
7. Transfer fees to treasury

**XP System**:
- Base: 100 XP per match
- Win multiplier: 2x = 200 XP
- Streak bonus: +10 XP per streak (max +500)
- Level formula: `sqrt(xp / 1000)`

**Events**: `WinningsClaimed`

---

### 8. **cancel_match**
**File**: [cancel_match.rs](src/instructions/cancel_match.rs)

**Purpose**: Cancel an open match

**Accounts**:
- `config` - GameConfig
- `match_account` - Match (Open)
- `authority` - Creator or protocol authority

**Validation**:
- Match status = Open (not started)
- Caller is creator OR protocol authority

**Flow**:
1. Set status = Cancelled
2. Set resolved_at timestamp

**Note**: Players must call separate refund instruction or claim_winnings handles refunds for cancelled matches

**Events**: `MatchCancelled`

---

### 9. **update_user_profile**
**File**: [update_user_profile.rs](src/instructions/update_user_profile.rs)

**Purpose**: Create/update user profile and set username

**Accounts**:
- `user_profile` - UserProfile PDA (init_if_needed)
- `user` - Signer
- `system_program`

**Params**:
- `username` - Optional username (max 32 chars)

**Validation**:
- Username ≤ 32 chars
- Only alphanumeric and underscores

**Flow**:
1. Initialize profile if new
2. Update username if provided

**Events**: `UsernameUpdated`

---

## 📊 State Accounts

### GameConfig
- **PDA**: `["game-config"]`
- **Size**: 92 bytes
- Global configuration and stats

### Market
- **PDA**: `["market", market_id]`
- **Size**: 226 bytes
- Market definition with Pyth feed

### Match
- **PDA**: `["match", match_id]`
- **Size**: 164 bytes
- Match instance with lifecycle state

### PlayerEntry
- **PDA**: `["player-entry", match, player]`
- **Size**: 101 bytes
- Player's participation in a match

### UserProfile
- **PDA**: `["user-profile", user]`
- **Size**: 135 bytes
- Player stats and progression

---

## 🎯 Match Lifecycle

```
1. CREATE MATCH
   Status: Open
   ↓
2. PLAYERS JOIN
   Transfer entry fees to vault
   If full → InProgress
   ↓
3. SUBMIT PREDICTIONS
   Within prediction_window
   First prediction sets start_price
   ↓
4. MATCH RUNS
   Duration passes
   ↓
5. RESOLVE MATCH
   After resolution_time
   Fetch end_price from Pyth
   Determine winner
   Status: Completed
   ↓
6. CLAIM WINNINGS
   Winners get share of prize pool
   Protocol fee sent to treasury
   Stats updated
```

---

## 🔐 Security Features

- ✅ PDA validation on all accounts
- ✅ Authority checks (config updates, cancel)
- ✅ State machine validation (MatchStatus)
- ✅ Time window validation (prediction deadline, resolution time)
- ✅ Pyth price staleness checks (< 60s)
- ✅ Arithmetic overflow protection
- ✅ Entry fee range validation
- ✅ Player count limits
- ✅ Double-claim protection

---

## 📡 Events Emitted

1. `ConfigInitialized` - Protocol initialized
2. `MarketCreated` - New market added
3. `MatchCreated` - New match created
4. `PlayerJoined` - Player joined match
5. `PredictionSubmitted` - Player locked prediction
6. `MatchResolved` - Match outcome determined
7. `WinningsClaimed` - Winnings distributed
8. `MatchCancelled` - Match cancelled
9. `UsernameUpdated` - Username changed

---

## 🧮 Fee Calculation

**Protocol Fee**: 3% (300 bps)

```rust
protocol_fee = total_pot * 300 / 10000
prize_pool = total_pot - protocol_fee
per_winner = prize_pool / winner_count
```

Example with 10 SOL pot, 3 winners:
- Protocol fee: 0.3 SOL
- Prize pool: 9.7 SOL
- Per winner: 3.23 SOL

---

## 🎮 XP & Leveling

**XP Calculation**:
```rust
base_xp = 100
win_xp = base_xp * 2 = 200

if won {
    streak_bonus = min(current_streak * 10, 500)
    total_xp = win_xp + streak_bonus
} else {
    total_xp = base_xp
}
```

**Level Calculation**:
```rust
level = sqrt(total_xp / 1000)
```

Examples:
- 1,000 XP → Level 1
- 4,000 XP → Level 2
- 9,000 XP → Level 3
- 25,000 XP → Level 5

---

## 🔌 Pyth Integration

Using `pyth-solana-receiver-sdk`:

```rust
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

let feed_id = get_feed_id_from_hex(&market.pyth_price_feed.to_string())?;

let price = price_update
    .get_price_no_older_than(&clock, 60, &feed_id)
    .map_err(|_| ErrorCode::StalePriceData)?;

let current_price = price.price as u64;
```

---

## 🚀 Next Steps

1. Add comprehensive tests
2. Add refund instruction for cancelled matches
3. Add admin functions (pause, update fees)
4. Add tournament bracket logic
5. Add leaderboard ranking
6. Deploy to devnet
7. Security audit

---

**Total Instructions**: 9
**Total Events**: 9
**Total Errors**: 24
**Lines of Code**: ~1,200
