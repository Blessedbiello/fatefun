use anchor_lang::prelude::*;

/// Proposal status in the futarchy system
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ProposalStatus {
    /// Actively accepting trades
    Active,
    /// Passed (pass_price > fail_price at end)
    Passed,
    /// Rejected (fail_price >= pass_price at end)
    Rejected,
    /// Executed (market created in fate_arena)
    Executed,
    /// Cancelled by proposer
    Cancelled,
}

/// Proposal - One per market proposal using futarchy
#[account]
pub struct Proposal {
    /// Unique proposal ID
    pub proposal_id: u64,

    /// Proposer's public key
    pub proposer: Pubkey,

    /// Market name (max 64 bytes)
    pub market_name: [u8; 64],

    /// Market description (max 200 bytes)
    pub market_description: [u8; 200],

    /// Pyth price feed for this market
    pub pyth_price_feed: Pubkey,

    /// Current status
    pub status: ProposalStatus,

    /// Total SOL in "pass" pool
    pub pass_pool: u64,

    /// Total SOL in "fail" pool
    pub fail_pool: u64,

    /// Derived price for "pass" outcome (in basis points, 0-10000)
    pub pass_price: u64,

    /// Derived price for "fail" outcome (in basis points, 0-10000)
    pub fail_price: u64,

    /// Creation timestamp
    pub created_at: i64,

    /// When voting ends
    pub voting_ends_at: i64,

    /// When proposal was executed (if executed)
    pub executed_at: Option<i64>,

    /// Bump seed for PDA
    pub bump: u8,
}

impl Proposal {
    pub const LEN: usize = 8 + // discriminator
        8 + // proposal_id
        32 + // proposer
        64 + // market_name
        200 + // market_description
        32 + // pyth_price_feed
        1 + // status
        8 + // pass_pool
        8 + // fail_pool
        8 + // pass_price
        8 + // fail_price
        8 + // created_at
        8 + // voting_ends_at
        1 + 8 + // executed_at (Option)
        1; // bump

    pub const MAX_NAME_LEN: usize = 64;
    pub const MAX_DESCRIPTION_LEN: usize = 200;

    /// Calculate AMM-style prices from pool sizes
    /// pass_price = fail_pool / total_pool
    /// fail_price = pass_pool / total_pool
    /// Returns prices in basis points (0-10000 = 0-100%)
    pub fn calculate_prices(&mut self) {
        let total_pool = self.pass_pool.saturating_add(self.fail_pool);

        if total_pool == 0 {
            // No liquidity yet, set 50/50
            self.pass_price = 5000;
            self.fail_price = 5000;
        } else {
            // AMM formula: price is proportional to opposite pool
            self.pass_price = (self.fail_pool as u128 * 10000 / total_pool as u128) as u64;
            self.fail_price = (self.pass_pool as u128 * 10000 / total_pool as u128) as u64;
        }
    }

    /// Check if proposal has passed based on price signal
    /// Pass if pass_price < fail_price (more demand for "pass" tokens)
    /// This means the market believes the proposal will increase value
    pub fn has_passed(&self) -> bool {
        self.pass_price < self.fail_price
    }

    /// Calculate total liquidity
    pub fn total_liquidity(&self) -> u64 {
        self.pass_pool.saturating_add(self.fail_pool)
    }
}
