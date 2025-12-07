use anchor_lang::prelude::*;

#[constant]
pub const ARENA_SEED: &[u8] = b"arena";

#[constant]
pub const MATCH_SEED: &[u8] = b"match";

#[constant]
pub const PLAYER_SEED: &[u8] = b"player";

#[constant]
pub const PREDICTION_SEED: &[u8] = b"prediction";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

// Match configuration
pub const MIN_PLAYERS: u8 = 2;
pub const MAX_PLAYERS: u8 = 10;
pub const MIN_BET_AMOUNT: u64 = 1_000_000; // 0.001 SOL
pub const MAX_BET_AMOUNT: u64 = 10_000_000_000; // 10 SOL
pub const MATCH_DURATION: i64 = 300; // 5 minutes in seconds
pub const RESOLUTION_WINDOW: i64 = 60; // 1 minute window to resolve

// Fees
pub const PLATFORM_FEE_BPS: u16 = 250; // 2.5%
pub const TREASURY_FEE_BPS: u16 = 100; // 1%
pub const BASIS_POINTS: u16 = 10_000;

// Oracle configuration
pub const PYTH_STALENESS_THRESHOLD: u64 = 60; // 60 seconds
pub const PRICE_PRECISION: u64 = 1_000_000; // 6 decimals
