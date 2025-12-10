use anchor_lang::prelude::*;
use crate::constants::seeds;
use crate::errors::ErrorCode as CouncilError;
use crate::state::*;

#[derive(Accounts)]
pub struct ResolveProposal<'info> {
    #[account(
        mut,
        seeds = [seeds::PROPOSAL, proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump,
        constraint = proposal.status == ProposalStatus::Active @ CouncilError::ProposalNotActive
    )]
    pub proposal: Account<'info, Proposal>,

    /// Anyone can call this after voting period ends
    pub resolver: Signer<'info>,
}

pub fn handler(ctx: Context<ResolveProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    // Ensure voting period has ended
    require!(
        clock.unix_timestamp >= proposal.voting_ends_at,
        CouncilError::VotingPeriodNotEnded
    );

    // Determine outcome based on price signal
    // If pass_price < fail_price, it means more demand for "pass" tokens
    // This signals the market believes the proposal will succeed
    let passed = proposal.has_passed();

    // Update status
    proposal.status = if passed {
        ProposalStatus::Passed
    } else {
        ProposalStatus::Rejected
    };

    emit!(ProposalResolved {
        proposal_id: proposal.proposal_id,
        status: proposal.status,
        pass_pool: proposal.pass_pool,
        fail_pool: proposal.fail_pool,
        pass_price: proposal.pass_price,
        fail_price: proposal.fail_price,
    });

    msg!("Proposal {} resolved: {:?}", proposal.proposal_id, proposal.status);
    msg!(
        "Final pools - Pass: {} lamports, Fail: {} lamports",
        proposal.pass_pool,
        proposal.fail_pool
    );
    msg!(
        "Final prices - Pass: {} bps, Fail: {} bps",
        proposal.pass_price,
        proposal.fail_price
    );

    Ok(())
}

#[event]
pub struct ProposalResolved {
    pub proposal_id: u64,
    pub status: ProposalStatus,
    pub pass_pool: u64,
    pub fail_pool: u64,
    pub pass_price: u64,
    pub fail_price: u64,
}
