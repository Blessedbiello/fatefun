use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::constants::seeds;
use crate::errors::ErrorCode as CouncilError;
use crate::state::*;

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        mut,
        seeds = [seeds::PROPOSAL, proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump,
        constraint = proposal.status == ProposalStatus::Active @ CouncilError::ProposalNotActive,
        constraint = proposer.key() == proposal.proposer @ CouncilError::Unauthorized
    )]
    pub proposal: Account<'info, Proposal>,

    /// CHECK: Vault holding stake
    #[account(
        mut,
        seeds = [seeds::PROPOSAL_VAULT, proposal.key().as_ref()],
        bump
    )]
    pub proposal_vault: AccountInfo<'info>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CancelProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    // Can only cancel if no one has traded yet
    require!(
        proposal.pass_pool == 0 && proposal.fail_pool == 0,
        CouncilError::CannotCancelAfterVotingStarted
    );

    // Refund stake to proposer
    let vault_key = proposal.key();
    let vault_bump = ctx.bumps.proposal_vault;
    let vault_seeds = &[
        seeds::PROPOSAL_VAULT,
        vault_key.as_ref(),
        &[vault_bump],
    ];
    let signer_seeds = &[&vault_seeds[..]];

    let vault_balance = ctx.accounts.proposal_vault.lamports();
    if vault_balance > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.proposal_vault.to_account_info(),
                    to: ctx.accounts.proposer.to_account_info(),
                },
                signer_seeds,
            ),
            vault_balance,
        )?;
    }

    proposal.status = ProposalStatus::Cancelled;

    msg!("Proposal {} cancelled, stake refunded", proposal.proposal_id);

    Ok(())
}
