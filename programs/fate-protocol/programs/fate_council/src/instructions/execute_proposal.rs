use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
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
        constraint = proposal.state == ProposalState::Active @ FateCouncilError::ProposalNotActive
    )]
    pub proposal: Account<'info, Proposal>,

    pub executor: Signer<'info>,
}

pub fn handler(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let council = &mut ctx.accounts.council;
    let clock = Clock::get()?;

    // Check voting period ended
    require!(
        clock.unix_timestamp > proposal.end_time,
        FateCouncilError::VotingPeriodNotEnded
    );

    // Check execution delay
    require!(
        clock.unix_timestamp >= proposal.end_time + council.execution_delay,
        FateCouncilError::ExecutionDelayNotMet
    );

    // Calculate quorum
    let quorum = council.total_voting_power
        .checked_mul(council.quorum_percentage as u64)
        .unwrap()
        .checked_div(100)
        .unwrap();

    require!(
        proposal.total_votes >= quorum,
        FateCouncilError::QuorumNotReached
    );

    // Check approval threshold
    let approval_percentage = if proposal.total_votes > 0 {
        (proposal.votes_for * 100) / proposal.total_votes
    } else {
        0
    };

    if approval_percentage >= council.approval_threshold as u64 {
        proposal.state = ProposalState::Succeeded;

        // Execute proposal logic here based on proposal_type
        // This would interact with other programs/accounts

        proposal.state = ProposalState::Executed;
        proposal.executed_at = clock.unix_timestamp;

        msg!("Proposal {} executed", proposal.proposal_id);
    } else {
        proposal.state = ProposalState::Defeated;
        msg!("Proposal {} defeated", proposal.proposal_id);
    }

    council.active_proposals = council.active_proposals.saturating_sub(1);

    Ok(())
}
