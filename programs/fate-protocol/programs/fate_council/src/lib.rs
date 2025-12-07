use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("FATEcouncBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump");

#[program]
pub mod fate_council {
    use super::*;

    /// Initialize the council
    pub fn initialize_council(ctx: Context<InitializeCouncil>, params: InitializeCouncilParams) -> Result<()> {
        instructions::initialize_council::handler(ctx, params)
    }

    /// Create a new market proposal
    pub fn create_proposal(ctx: Context<CreateProposal>, params: CreateProposalParams) -> Result<()> {
        instructions::create_proposal::handler(ctx, params)
    }

    /// Cast a vote on a proposal
    pub fn cast_vote(ctx: Context<CastVote>, params: CastVoteParams) -> Result<()> {
        instructions::cast_vote::handler(ctx, params)
    }

    /// Execute an approved proposal
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        instructions::execute_proposal::handler(ctx)
    }

    /// Cancel a proposal
    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        instructions::cancel_proposal::handler(ctx)
    }
}
