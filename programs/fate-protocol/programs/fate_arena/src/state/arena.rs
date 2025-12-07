use anchor_lang::prelude::*;

#[account]
pub struct Arena {
    /// Authority that can update arena settings
    pub authority: Pubkey,

    /// Treasury account for collecting fees
    pub treasury: Pubkey,

    /// Total number of matches created
    pub total_matches: u64,

    /// Total number of active matches
    pub active_matches: u64,

    /// Total volume traded (in lamports)
    pub total_volume: u64,

    /// Total fees collected (in lamports)
    pub total_fees: u64,

    /// Platform fee in basis points
    pub platform_fee_bps: u16,

    /// Treasury fee in basis points
    pub treasury_fee_bps: u16,

    /// Minimum bet amount
    pub min_bet: u64,

    /// Maximum bet amount
    pub max_bet: u64,

    /// Whether the arena is paused
    pub paused: bool,

    /// Bump seed for PDA
    pub bump: u8,
}

impl Arena {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // treasury
        8 + // total_matches
        8 + // active_matches
        8 + // total_volume
        8 + // total_fees
        2 + // platform_fee_bps
        2 + // treasury_fee_bps
        8 + // min_bet
        8 + // max_bet
        1 + // paused
        1; // bump
}
