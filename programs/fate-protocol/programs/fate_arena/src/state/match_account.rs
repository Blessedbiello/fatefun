use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MatchState {
    Pending,
    Active,
    Ended,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketType {
    PriceDirection, // Will price go up or down?
    PriceTarget,    // Will price reach a target?
    PriceRange,     // Will price stay in range?
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PredictionOutcome {
    Up,
    Down,
    InRange,
    OutOfRange,
    TargetHit,
    TargetMissed,
}

#[account]
pub struct Match {
    /// Match ID
    pub match_id: u64,

    /// Match creator
    pub creator: Pubkey,

    /// Current state
    pub state: MatchState,

    /// Market type
    pub market_type: MarketType,

    /// Pyth price feed account
    pub price_feed: Pubkey,

    /// Asset symbol (e.g., "SOL/USD")
    pub asset_symbol: [u8; 16],

    /// Entry price when match starts
    pub entry_price: i64,

    /// Exit price when match ends
    pub exit_price: i64,

    /// Target price (for PriceTarget market)
    pub target_price: i64,

    /// Price range min (for PriceRange market)
    pub range_min: i64,

    /// Price range max (for PriceRange market)
    pub range_max: i64,

    /// Entry fee per player
    pub entry_fee: u64,

    /// Total prize pool
    pub prize_pool: u64,

    /// Number of players
    pub player_count: u8,

    /// Maximum players allowed
    pub max_players: u8,

    /// Match start timestamp
    pub start_time: i64,

    /// Match end timestamp
    pub end_time: i64,

    /// Match duration in seconds
    pub duration: i64,

    /// Winning outcome
    pub winning_outcome: Option<PredictionOutcome>,

    /// Number of winners
    pub winner_count: u8,

    /// Resolution timestamp
    pub resolved_at: i64,

    /// Bump seed
    pub bump: u8,
}

impl Match {
    pub const LEN: usize = 8 + // discriminator
        8 + // match_id
        32 + // creator
        1 + // state
        1 + // market_type
        32 + // price_feed
        16 + // asset_symbol
        8 + // entry_price
        8 + // exit_price
        8 + // target_price
        8 + // range_min
        8 + // range_max
        8 + // entry_fee
        8 + // prize_pool
        1 + // player_count
        1 + // max_players
        8 + // start_time
        8 + // end_time
        8 + // duration
        1 + 1 + // winning_outcome (Option + enum)
        1 + // winner_count
        8 + // resolved_at
        1; // bump
}
