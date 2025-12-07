use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VoteChoice {
    For,
    Against,
    Abstain,
}

#[account]
pub struct Vote {
    /// Proposal this vote is for
    pub proposal: Pubkey,

    /// Voter
    pub voter: Pubkey,

    /// Vote choice
    pub choice: VoteChoice,

    /// Voting power used
    pub voting_power: u64,

    /// Timestamp
    pub voted_at: i64,

    /// Bump seed
    pub bump: u8,
}

impl Vote {
    pub const LEN: usize = 8 + // discriminator
        32 + // proposal
        32 + // voter
        1 + // choice
        8 + // voting_power
        8 + // voted_at
        1; // bump
}
