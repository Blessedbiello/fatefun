use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ProposalState {
    Active,
    Succeeded,
    Defeated,
    Executed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalType {
    AddMarket { asset_symbol: [u8; 16], price_feed: Pubkey },
    UpdateFees { platform_fee_bps: u16, treasury_fee_bps: u16 },
    UpdateLimits { min_bet: u64, max_bet: u64 },
    Treasury { recipient: Pubkey, amount: u64 },
}

#[account]
pub struct Proposal {
    /// Proposal ID
    pub proposal_id: u64,

    /// Proposer
    pub proposer: Pubkey,

    /// Proposal type
    pub proposal_type: ProposalType,

    /// Description (max 200 chars)
    pub description: [u8; 200],

    /// Current state
    pub state: ProposalState,

    /// Votes for
    pub votes_for: u64,

    /// Votes against
    pub votes_against: u64,

    /// Total votes cast
    pub total_votes: u64,

    /// Start timestamp
    pub start_time: i64,

    /// End timestamp
    pub end_time: i64,

    /// Execution timestamp
    pub executed_at: i64,

    /// Bump seed
    pub bump: u8,
}

impl Proposal {
    pub const LEN: usize = 8 + // discriminator
        8 + // proposal_id
        32 + // proposer
        1 + 200 + // proposal_type (enum + max variant size)
        200 + // description
        1 + // state
        8 + // votes_for
        8 + // votes_against
        8 + // total_votes
        8 + // start_time
        8 + // end_time
        8 + // executed_at
        1; // bump
}
