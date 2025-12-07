use anchor_lang::prelude::*;

#[account]
pub struct Council {
    /// Council authority
    pub authority: Pubkey,

    /// Total proposals created
    pub total_proposals: u64,

    /// Active proposals count
    pub active_proposals: u64,

    /// Total voting power
    pub total_voting_power: u64,

    /// Minimum voting power to create proposal
    pub min_vote_threshold: u64,

    /// Proposal duration in seconds
    pub proposal_duration: i64,

    /// Execution delay after approval
    pub execution_delay: i64,

    /// Quorum percentage (0-100)
    pub quorum_percentage: u8,

    /// Approval threshold percentage (0-100)
    pub approval_threshold: u8,

    /// Bump seed
    pub bump: u8,
}

impl Council {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 + // total_proposals
        8 + // active_proposals
        8 + // total_voting_power
        8 + // min_vote_threshold
        8 + // proposal_duration
        8 + // execution_delay
        1 + // quorum_percentage
        1 + // approval_threshold
        1; // bump
}
