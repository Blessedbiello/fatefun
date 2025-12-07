use anchor_lang::prelude::*;

/// CouncilConfig - Single instance PDA for council configuration
#[account]
pub struct CouncilConfig {
    /// Council authority (can update config)
    pub authority: Pubkey,

    /// FATE Arena program ID (for CPI calls)
    pub fate_arena_program: Pubkey,

    /// SOL required to create a proposal
    pub proposal_stake: u64,

    /// Voting period duration (48 hours default = 172800 seconds)
    pub voting_period: i64,

    /// Total number of proposals created
    pub total_proposals: u64,

    /// Proposer bonus percentage (basis points, e.g., 200 = 2%)
    pub proposer_bonus_bps: u16,

    /// Bump seed for PDA
    pub bump: u8,
}

impl CouncilConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // fate_arena_program
        8 + // proposal_stake
        8 + // voting_period
        8 + // total_proposals
        2 + // proposer_bonus_bps
        1; // bump

    /// Default voting period: 48 hours
    pub const DEFAULT_VOTING_PERIOD: i64 = 48 * 60 * 60;

    /// Default proposal stake: 1 SOL
    pub const DEFAULT_PROPOSAL_STAKE: u64 = 1_000_000_000;

    /// Default proposer bonus: 2%
    pub const DEFAULT_PROPOSER_BONUS_BPS: u16 = 200;
}
