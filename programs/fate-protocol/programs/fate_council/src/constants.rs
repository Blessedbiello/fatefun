use anchor_lang::prelude::*;

/// PDA Seeds
pub mod seeds {
    pub const COUNCIL_CONFIG: &[u8] = b"council_config";
    pub const PROPOSAL: &[u8] = b"proposal";
    pub const PROPOSAL_VOTE: &[u8] = b"proposal_vote";
    pub const PROPOSAL_VAULT: &[u8] = b"proposal_vault";
}

/// Futarchy parameters
pub const MIN_TRADE_AMOUNT: u64 = 10_000_000; // 0.01 SOL minimum trade
pub const MAX_TRADE_AMOUNT: u64 = 100_000_000_000; // 100 SOL maximum trade

/// Basis points (10000 = 100%)
pub const BPS_DENOMINATOR: u64 = 10_000;
