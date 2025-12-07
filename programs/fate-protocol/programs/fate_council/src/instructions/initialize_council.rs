use anchor_lang::prelude::*;
use crate::constants::*;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeCouncilParams {
    pub min_vote_threshold: u64,
    pub proposal_duration: i64,
    pub execution_delay: i64,
    pub quorum_percentage: u8,
    pub approval_threshold: u8,
}

#[derive(Accounts)]
pub struct InitializeCouncil<'info> {
    #[account(
        init,
        payer = authority,
        space = Council::LEN,
        seeds = [COUNCIL_SEED],
        bump
    )]
    pub council: Account<'info, Council>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeCouncil>, params: InitializeCouncilParams) -> Result<()> {
    let council = &mut ctx.accounts.council;

    council.authority = ctx.accounts.authority.key();
    council.total_proposals = 0;
    council.active_proposals = 0;
    council.total_voting_power = 0;
    council.min_vote_threshold = params.min_vote_threshold;
    council.proposal_duration = params.proposal_duration;
    council.execution_delay = params.execution_delay;
    council.quorum_percentage = params.quorum_percentage;
    council.approval_threshold = params.approval_threshold;
    council.bump = ctx.bumps.council;

    msg!("Council initialized");

    Ok(())
}
