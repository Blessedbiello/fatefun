use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateProposalParams {
    pub proposal_type: ProposalType,
    pub description: [u8; 200],
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [COUNCIL_SEED],
        bump = council.bump
    )]
    pub council: Account<'info, Council>,

    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [PROPOSAL_SEED, council.total_proposals.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateProposal>, params: CreateProposalParams) -> Result<()> {
    let council = &mut ctx.accounts.council;
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    let proposal_id = council.total_proposals;

    proposal.proposal_id = proposal_id;
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.proposal_type = params.proposal_type;
    proposal.description = params.description;
    proposal.state = ProposalState::Active;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.total_votes = 0;
    proposal.start_time = clock.unix_timestamp;
    proposal.end_time = clock.unix_timestamp + council.proposal_duration;
    proposal.executed_at = 0;
    proposal.bump = ctx.bumps.proposal;

    council.total_proposals = council.total_proposals.checked_add(1).unwrap();
    council.active_proposals = council.active_proposals.checked_add(1).unwrap();

    msg!("Proposal {} created", proposal_id);

    Ok(())
}
