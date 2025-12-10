use anchor_lang::prelude::*;

pub mod instructions;
pub mod utils;

use instructions::*;
pub use utils::*;

declare_id!("HRF68UNqq3ASruJFacsBhV7iQyfLF697FhjPCfLNXQxa");

#[program]
pub mod fate_arena {
    use super::*;

    /// Initialize global game configuration
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        params: InitializeConfigParams,
    ) -> Result<()> {
        instructions::initialize_config::handler(ctx, params)
    }

    /// Create a new market with Pyth price feed
    pub fn create_market(
        ctx: Context<CreateMarket>,
        params: CreateMarketParams,
    ) -> Result<()> {
        instructions::create_market::handler(ctx, params)
    }

    /// Create a new match (creator auto-joins)
    pub fn create_match(
        ctx: Context<CreateMatch>,
        params: CreateMatchParams,
    ) -> Result<()> {
        instructions::create_match::handler(ctx, params)
    }

    /// Join an existing match
    pub fn join_match(ctx: Context<JoinMatch>) -> Result<()> {
        instructions::join_match::handler(ctx)
    }

    /// Submit prediction for a match
    pub fn submit_prediction(
        ctx: Context<SubmitPrediction>,
        params: SubmitPredictionParams,
    ) -> Result<()> {
        instructions::submit_prediction::handler(ctx, params)
    }

    /// Resolve a match using Pyth oracle
    pub fn resolve_match(ctx: Context<ResolveMatch>) -> Result<()> {
        instructions::resolve_match::handler(ctx)
    }

    /// Claim winnings from a completed match
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }

    /// Cancel an open match
    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        instructions::cancel_match::handler(ctx)
    }

    /// Update user profile (username)
    pub fn update_user_profile(
        ctx: Context<UpdateUserProfile>,
        params: UpdateUserProfileParams,
    ) -> Result<()> {
        instructions::update_user_profile::handler(ctx, params)
    }
}

// ============================================================================
// State Accounts
// ============================================================================

/// Global game configuration
/// PDA: ["game-config"]
#[account]
pub struct GameConfig {
    /// Authority that can update config
    pub authority: Pubkey,

    /// Treasury wallet to receive protocol fees
    pub treasury: Pubkey,

    /// Protocol fee in basis points (300 = 3%)
    pub protocol_fee_bps: u16,

    /// Total number of matches created
    pub total_matches: u64,

    /// Total volume traded in lamports
    pub total_volume: u64,

    /// Emergency pause flag
    pub paused: bool,

    /// PDA bump
    pub bump: u8,
}

impl GameConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // treasury
        2 +  // protocol_fee_bps
        8 +  // total_matches
        8 +  // total_volume
        1 +  // paused
        1;   // bump

    /// Maximum protocol fee (10% = 1000 bps)
    pub const MAX_PROTOCOL_FEE_BPS: u16 = 1000;
}

/// Market definition for different asset pairs
/// PDA: ["market", market_id.to_le_bytes()]
#[account]
pub struct Market {
    /// Unique market identifier
    pub market_id: u64,

    /// Market name (e.g., "SOL/USD")
    /// String stored as fixed-size array
    pub name: [u8; 32],

    /// Market description
    pub description: [u8; 128],

    /// Pyth price feed account
    pub pyth_price_feed: Pubkey,

    /// Whether market is active for new matches
    pub active: bool,

    /// Total matches created in this market
    pub total_matches: u64,

    /// Creation timestamp
    pub created_at: i64,

    /// PDA bump
    pub bump: u8,
}

impl Market {
    pub const LEN: usize = 8 +   // discriminator
        8 +   // market_id
        32 +  // name
        128 + // description
        32 +  // pyth_price_feed
        1 +   // active
        8 +   // total_matches
        8 +   // created_at
        1;    // bump

    /// Helper to get name as string
    pub fn get_name(&self) -> Result<String> {
        let end = self.name.iter().position(|&c| c == 0).unwrap_or(32);
        String::from_utf8(self.name[..end].to_vec())
            .map_err(|_| error!(ErrorCode::InvalidMarketName))
    }

    /// Helper to get description as string
    pub fn get_description(&self) -> Result<String> {
        let end = self.description.iter().position(|&c| c == 0).unwrap_or(128);
        String::from_utf8(self.description[..end].to_vec())
            .map_err(|_| error!(ErrorCode::InvalidMarketDescription))
    }
}

/// Match instance
/// PDA: ["match", match_id.to_le_bytes()]
#[account]
pub struct Match {
    /// Unique match identifier
    pub match_id: u64,

    /// Market this match belongs to
    pub market: Pubkey,

    /// Match creator
    pub creator: Pubkey,

    /// Type of match
    pub match_type: MatchType,

    /// Entry fee in lamports
    pub entry_fee: u64,

    /// Maximum number of players
    pub max_players: u8,

    /// Current number of players
    pub current_players: u8,

    /// Match status
    pub status: MatchStatus,

    /// Starting price (set when match starts)
    pub start_price: Option<u64>,

    /// Ending price (set when match resolves)
    pub end_price: Option<u64>,

    /// Time window in seconds for players to make predictions
    pub prediction_window: i64,

    /// Timestamp when price will be checked for resolution
    pub resolution_time: i64,

    /// Winning prediction side (set after resolution)
    pub winning_side: Option<PredictionSide>,

    /// Total pot accumulated from entry fees
    pub total_pot: u64,

    /// Match creation timestamp
    pub created_at: i64,

    /// Match start timestamp
    pub started_at: Option<i64>,

    /// Match resolution timestamp
    pub resolved_at: Option<i64>,

    /// PDA bump
    pub bump: u8,
}

impl Match {
    pub const LEN: usize = 8 +  // discriminator
        8 +  // match_id
        32 + // market
        32 + // creator
        1 +  // match_type (enum)
        8 +  // entry_fee
        1 +  // max_players
        1 +  // current_players
        1 +  // status (enum)
        1 + 8 + // start_price (Option<u64>)
        1 + 8 + // end_price (Option<u64>)
        8 +  // prediction_window
        8 +  // resolution_time
        1 + 1 + // winning_side (Option<PredictionSide>)
        8 +  // total_pot
        8 +  // created_at
        1 + 8 + // started_at (Option<i64>)
        1 + 8 + // resolved_at (Option<i64>)
        1;   // bump

    /// Check if match is full
    pub fn is_full(&self) -> bool {
        self.current_players >= self.max_players
    }

    /// Check if match can start
    pub fn can_start(&self) -> bool {
        self.status == MatchStatus::Open &&
        self.current_players >= 2 && // Minimum 2 players
        Clock::get().unwrap().unix_timestamp >= self.created_at + self.prediction_window
    }

    /// Check if match can be resolved
    pub fn can_resolve(&self) -> bool {
        self.status == MatchStatus::InProgress &&
        Clock::get().unwrap().unix_timestamp >= self.resolution_time
    }

    /// Calculate protocol fee for this match
    pub fn calculate_protocol_fee(&self, fee_bps: u16) -> u64 {
        (self.total_pot as u128 * fee_bps as u128 / 10000) as u64
    }

    /// Calculate prize pool after fees
    pub fn calculate_prize_pool(&self, fee_bps: u16) -> u64 {
        self.total_pot - self.calculate_protocol_fee(fee_bps)
    }
}

/// Player entry in a match
/// PDA: ["player-entry", match.key(), player.key()]
#[account]
pub struct PlayerEntry {
    /// Match this entry belongs to
    pub match_account: Pubkey,

    /// Player wallet
    pub player: Pubkey,

    /// Player's prediction (None until locked)
    pub prediction: Option<PredictionSide>,

    /// Amount staked by player
    pub amount_staked: u64,

    /// Timestamp when prediction was locked
    pub prediction_locked_at: Option<i64>,

    /// Whether winnings have been claimed
    pub claimed: bool,

    /// Winnings amount (calculated after resolution)
    pub winnings: u64,

    /// PDA bump
    pub bump: u8,
}

impl PlayerEntry {
    pub const LEN: usize = 8 +  // discriminator
        32 + // match_account
        32 + // player
        1 + 1 + // prediction (Option<PredictionSide>)
        8 +  // amount_staked
        1 + 8 + // prediction_locked_at (Option<i64>)
        1 +  // claimed
        8 +  // winnings
        1;   // bump

    /// Check if prediction can be made
    pub fn can_predict(&self) -> bool {
        self.prediction.is_none() && !self.claimed
    }

    /// Check if winnings can be claimed
    pub fn can_claim(&self) -> bool {
        !self.claimed && self.winnings > 0
    }
}

/// User profile and statistics
/// PDA: ["user-profile", user.key()]
#[account]
pub struct UserProfile {
    /// User wallet
    pub user: Pubkey,

    /// Optional username (stored as fixed-size array)
    pub username: Option<[u8; 32]>,

    /// Total matches participated in
    pub total_matches: u64,

    /// Total wins
    pub wins: u64,

    /// Total losses
    pub losses: u64,

    /// Total amount wagered
    pub total_wagered: u64,

    /// Total amount won
    pub total_won: u64,

    /// Current win/loss streak (negative for losses)
    pub current_streak: i32,

    /// Best win streak achieved
    pub best_streak: u32,

    /// Experience points
    pub xp: u64,

    /// Current level
    pub level: u16,

    /// Profile creation timestamp
    pub created_at: i64,

    /// PDA bump
    pub bump: u8,
}

impl UserProfile {
    pub const LEN: usize = 8 +  // discriminator
        32 + // user
        1 + 32 + // username (Option<[u8; 32]>)
        8 +  // total_matches
        8 +  // wins
        8 +  // losses
        8 +  // total_wagered
        8 +  // total_won
        4 +  // current_streak
        4 +  // best_streak
        8 +  // xp
        2 +  // level
        8 +  // created_at
        1;   // bump

    /// Calculate win rate as percentage
    pub fn win_rate(&self) -> f64 {
        if self.total_matches == 0 {
            return 0.0;
        }
        (self.wins as f64 / self.total_matches as f64) * 100.0
    }

    /// Calculate net profit
    pub fn net_profit(&self) -> i64 {
        self.total_won as i64 - self.total_wagered as i64
    }

    /// Update streak on match result
    pub fn update_streak(&mut self, won: bool) {
        if won {
            self.current_streak = if self.current_streak >= 0 {
                self.current_streak + 1
            } else {
                1
            };
            self.best_streak = self.best_streak.max(self.current_streak as u32);
        } else {
            self.current_streak = if self.current_streak <= 0 {
                self.current_streak - 1
            } else {
                -1
            };
        }
    }

    /// Calculate level from XP (simple formula: level = sqrt(xp / 1000))
    pub fn calculate_level(&self) -> u16 {
        ((self.xp as f64 / 1000.0).sqrt() as u16).max(1)
    }

    /// Get username as string
    pub fn get_username(&self) -> Option<String> {
        self.username.and_then(|name| {
            let end = name.iter().position(|&c| c == 0).unwrap_or(32);
            String::from_utf8(name[..end].to_vec()).ok()
        })
    }
}

// ============================================================================
// Enums
// ============================================================================

/// Type of match
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum MatchType {
    /// 1v1 quick match (2 players)
    FlashDuel,

    /// Multi-player free-for-all (3-10 players)
    BattleRoyale,

    /// Structured tournament bracket
    Tournament,
}

/// Match lifecycle status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum MatchStatus {
    /// Open for players to join
    Open,

    /// Match started, predictions locked
    InProgress,

    /// Waiting for oracle price data
    Resolving,

    /// Match completed, winners determined
    Completed,

    /// Match cancelled (refunds issued)
    Cancelled,
}

/// Prediction direction
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum PredictionSide {
    /// Price will go higher
    Higher,

    /// Price will go lower
    Lower,
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Game is currently paused")]
    GamePaused,

    #[msg("Invalid protocol fee (max 10%)")]
    InvalidProtocolFee,

    #[msg("Invalid market name")]
    InvalidMarketName,

    #[msg("Invalid market description")]
    InvalidMarketDescription,

    #[msg("Market is not active")]
    MarketNotActive,

    #[msg("Match is full")]
    MatchFull,

    #[msg("Match has not started")]
    MatchNotStarted,

    #[msg("Match already started")]
    MatchAlreadyStarted,

    #[msg("Match is not in correct status")]
    InvalidMatchStatus,

    #[msg("Cannot start match yet (prediction window open)")]
    PredictionWindowNotClosed,

    #[msg("Cannot resolve match yet")]
    ResolutionTimeNotReached,

    #[msg("Invalid match type")]
    InvalidMatchType,

    #[msg("Invalid entry fee")]
    InvalidEntryFee,

    #[msg("Invalid max players")]
    InvalidMaxPlayers,

    #[msg("Invalid prediction window")]
    InvalidPredictionWindow,

    #[msg("Prediction already locked")]
    PredictionAlreadyLocked,

    #[msg("Cannot change prediction after lock")]
    CannotChangePrediction,

    #[msg("Already claimed winnings")]
    AlreadyClaimed,

    #[msg("No winnings to claim")]
    NoWinnings,

    #[msg("Player not in this match")]
    PlayerNotInMatch,

    #[msg("Not enough players to start")]
    NotEnoughPlayers,

    #[msg("Price data is stale (older than 30 seconds)")]
    StalePrice,

    #[msg("Invalid Pyth account or data")]
    InvalidPythAccount,

    #[msg("Price feed does not match expected feed")]
    PriceFeedMismatch,

    #[msg("Price is unavailable or invalid")]
    PriceUnavailable,

    #[msg("Confidence interval is too wide (>1%)")]
    ConfidenceIntervalTooWide,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,

    #[msg("Username too long")]
    UsernameTooLong,

    #[msg("Invalid username characters")]
    InvalidUsername,
}

// ============================================================================
// Constants
// ============================================================================

/// PDA seeds
pub mod seeds {
    pub const GAME_CONFIG: &[u8] = b"game-config";
    pub const MARKET: &[u8] = b"market";
    pub const MATCH: &[u8] = b"match";
    pub const PLAYER_ENTRY: &[u8] = b"player-entry";
    pub const USER_PROFILE: &[u8] = b"user-profile";
    pub const VAULT: &[u8] = b"vault";
}

/// Game constants
pub mod constants {
    /// Minimum entry fee (0.01 SOL)
    pub const MIN_ENTRY_FEE: u64 = 10_000_000;

    /// Maximum entry fee (100 SOL)
    pub const MAX_ENTRY_FEE: u64 = 100_000_000_000;

    /// Minimum prediction window (30 seconds)
    pub const MIN_PREDICTION_WINDOW: i64 = 30;

    /// Maximum prediction window (1 hour)
    pub const MAX_PREDICTION_WINDOW: i64 = 3600;

    /// Minimum match duration (1 minute)
    pub const MIN_MATCH_DURATION: i64 = 60;

    /// Maximum match duration (24 hours)
    pub const MAX_MATCH_DURATION: i64 = 86400;

    /// Minimum players for BattleRoyale
    pub const MIN_BATTLE_ROYALE_PLAYERS: u8 = 3;

    /// Maximum players for any match
    pub const MAX_PLAYERS: u8 = 10;

    /// Pyth price staleness threshold (60 seconds)
    pub const PYTH_STALENESS_THRESHOLD: i64 = 60;

    /// XP awarded per match (base)
    pub const BASE_XP_PER_MATCH: u64 = 100;

    /// XP multiplier for wins
    pub const WIN_XP_MULTIPLIER: u64 = 2;

    /// Basis points denominator
    pub const BPS_DENOMINATOR: u16 = 10000;
}
