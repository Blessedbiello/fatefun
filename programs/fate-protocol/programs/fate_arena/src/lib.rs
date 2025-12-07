use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("FATEarenaBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump");

#[program]
pub mod fate_arena {
    use super::*;

    /// Initialize the global arena state
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        instructions::initialize::handler(ctx, params)
    }

    /// Create a new match with prediction parameters
    pub fn create_match(ctx: Context<CreateMatch>, params: CreateMatchParams) -> Result<()> {
        instructions::create_match::handler(ctx, params)
    }

    /// Player joins a match and makes a prediction
    pub fn join_match(ctx: Context<JoinMatch>, params: JoinMatchParams) -> Result<()> {
        instructions::join_match::handler(ctx, params)
    }

    /// Start the match when enough players have joined
    pub fn start_match(ctx: Context<StartMatch>) -> Result<()> {
        instructions::start_match::handler(ctx)
    }

    /// Resolve the match using Pyth price feed
    pub fn resolve_match(ctx: Context<ResolveMatch>) -> Result<()> {
        instructions::resolve_match::handler(ctx)
    }

    /// Claim winnings from a resolved match
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }

    /// Cancel a match that hasn't started
    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        instructions::cancel_match::handler(ctx)
    }

    /// Update player stats
    pub fn update_stats(ctx: Context<UpdateStats>) -> Result<()> {
        instructions::update_stats::handler(ctx)
    }
}
