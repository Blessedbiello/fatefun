use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        mut,
        seeds = [COUNCIL_SEED],
        bump = council.bump
    )]
    pub council: Account<'info, Council>,

    #[account(
        mut,
        seeds = [PROPOSAL_SEED, proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump,
        constraint = proposal.state == ProposalState::Active @ FateCouncilError::ProposalNotActive,
        constraint = authority.key() == proposal.proposer || authority.key() == council.authority @ FateCouncilError::Unauthorized
    )]
    pub proposal: Account<'info, Proposal>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<CancelProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let council = &mut ctx.accounts.council;

    proposal.state = ProposalState::Cancelled;
    council.active_proposals = council.active_proposals.saturating_sub(1);

    msg!("Proposal {} cancelled", proposal.proposal_id);

    Ok(())
}
