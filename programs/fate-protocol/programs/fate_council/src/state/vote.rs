use anchor_lang::prelude::*;

/// ProposalVote - Tracks each trader's position in a proposal's prediction market
#[account]
pub struct ProposalVote {
    /// Proposal this vote is for
    pub proposal: Pubkey,

    /// Trader/voter public key
    pub voter: Pubkey,

    /// Amount invested in "pass" pool
    pub pass_amount: u64,

    /// Amount invested in "fail" pool
    pub fail_amount: u64,

    /// Whether winnings have been claimed
    pub claimed: bool,

    /// Bump seed for PDA
    pub bump: u8,
}

impl ProposalVote {
    pub const LEN: usize = 8 + // discriminator
        32 + // proposal
        32 + // voter
        8 + // pass_amount
        8 + // fail_amount
        1 + // claimed
        1; // bump

    /// Calculate total amount invested by this voter
    pub fn total_invested(&self) -> u64 {
        self.pass_amount.saturating_add(self.fail_amount)
    }

    /// Check if voter has any position
    pub fn has_position(&self) -> bool {
        self.pass_amount > 0 || self.fail_amount > 0
    }
}
