use anchor_lang::prelude::*;
use crate::{
    GameConfig, Match, MatchStatus, ErrorCode, seeds
};

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(
        seeds = [seeds::GAME_CONFIG],
        bump = config.bump
    )]
    pub config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [seeds::MATCH, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        constraint = match_account.status == MatchStatus::Open @ ErrorCode::InvalidMatchStatus
    )]
    pub match_account: Account<'info, Match>,

    #[account(
        constraint = authority.key() == match_account.creator ||
                     authority.key() == config.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<CancelMatch>) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;

    // Update status
    match_account.status = MatchStatus::Cancelled;
    match_account.resolved_at = Some(Clock::get()?.unix_timestamp);

    emit!(MatchCancelled {
        match_id: match_account.match_id,
        cancelled_by: ctx.accounts.authority.key(),
    });

    // Note: Players need to call a separate refund instruction
    // or we handle refunds in claim_winnings for cancelled matches

    Ok(())
}

#[event]
pub struct MatchCancelled {
    pub match_id: u64,
    pub cancelled_by: Pubkey,
}
