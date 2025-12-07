use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
pub use constants::*;
pub use errors::*;
pub use state::*;

declare_id!("FATEcouncBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump");

#[program]
pub mod fate_council {
    use super::*;

    /// Initialize the council with futarchy governance
    pub fn initialize_council(ctx: Context<InitializeCouncil>, params: InitializeCouncilParams) -> Result<()> {
        instructions::initialize_council::handler(ctx, params)
    }

    /// Create a new market proposal (stakes SOL)
    pub fn create_proposal(ctx: Context<CreateProposal>, params: CreateProposalParams) -> Result<()> {
        instructions::create_proposal::handler(ctx, params)
    }

    /// Trade on proposal outcome (buy Pass or Fail tokens)
    pub fn trade_outcome(ctx: Context<TradeOutcome>, params: TradeOutcomeParams) -> Result<()> {
        instructions::cast_vote::handler(ctx, params)
    }

    /// Resolve proposal after voting period ends
    pub fn resolve_proposal(ctx: Context<ResolveProposal>) -> Result<()> {
        instructions::resolve_proposal::handler(ctx)
    }

    /// Execute a passed proposal (creates market via CPI)
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        instructions::execute_proposal::handler(ctx)
    }

    /// Claim winnings from a resolved proposal
    pub fn claim_vote_tokens(ctx: Context<ClaimVoteTokens>) -> Result<()> {
        instructions::claim_vote_tokens::handler(ctx)
    }

    /// Cancel a proposal (only proposer, before voting starts)
    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        instructions::cancel_proposal::handler(ctx)
    }
}
