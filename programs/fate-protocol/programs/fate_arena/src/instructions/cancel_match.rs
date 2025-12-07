use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(
        mut,
        seeds = [ARENA_SEED],
        bump = arena.bump
    )]
    pub arena: Account<'info, Arena>,

    #[account(
        mut,
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        constraint = match_account.state == MatchState::Pending @ FateArenaError::CannotCancelStartedMatch,
        constraint = authority.key() == match_account.creator @ FateArenaError::Unauthorized
    )]
    pub match_account: Account<'info, Match>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<CancelMatch>) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let arena = &mut ctx.accounts.arena;

    match_account.state = MatchState::Cancelled;
    arena.active_matches = arena.active_matches.saturating_sub(1);

    msg!("Match {} cancelled", match_account.match_id);

    Ok(())
}
