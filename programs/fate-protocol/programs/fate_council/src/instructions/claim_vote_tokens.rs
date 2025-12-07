use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::constants::seeds;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct ClaimVoteTokens<'info> {
    #[account(
        mut,
        seeds = [seeds::PROPOSAL, proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump,
        constraint = proposal.status == ProposalStatus::Passed || proposal.status == ProposalStatus::Rejected @ ErrorCode::ProposalNotResolved
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        mut,
        seeds = [seeds::PROPOSAL_VOTE, proposal.key().as_ref(), voter.key().as_ref()],
        bump = proposal_vote.bump,
        constraint = !proposal_vote.claimed @ ErrorCode::AlreadyClaimed
    )]
    pub proposal_vote: Account<'info, ProposalVote>,

    /// CHECK: Vault holding liquidity
    #[account(
        mut,
        seeds = [seeds::PROPOSAL_VAULT, proposal.key().as_ref()],
        bump
    )]
    pub proposal_vault: AccountInfo<'info>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimVoteTokens>) -> Result<()> {
    let proposal = &ctx.accounts.proposal;
    let proposal_vote = &mut ctx.accounts.proposal_vote;

    // Determine winning side
    let winning_pool: u64;
    let losing_pool: u64;
    let winner_amount: u64;

    if proposal.status == ProposalStatus::Passed {
        // Pass side won
        winning_pool = proposal.pass_pool;
        losing_pool = proposal.fail_pool;
        winner_amount = proposal_vote.pass_amount;

        msg!("Proposal passed - Pass side wins");
    } else {
        // Fail side won
        winning_pool = proposal.fail_pool;
        losing_pool = proposal.pass_pool;
        winner_amount = proposal_vote.fail_amount;

        msg!("Proposal rejected - Fail side wins");
    }

    // Calculate payout
    // Winners split the losing pool proportionally to their stake
    // payout = winner_stake + (winner_stake / total_winning_pool * losing_pool)

    require!(winner_amount > 0, ErrorCode::NoWinnings);

    let share_of_winning_pool = if winning_pool > 0 {
        (winner_amount as u128 * losing_pool as u128 / winning_pool as u128) as u64
    } else {
        0
    };

    let total_payout = winner_amount.checked_add(share_of_winning_pool)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    // Transfer winnings
    let vault_key = proposal.key();
    let vault_bump = ctx.bumps.proposal_vault;
    let vault_seeds = &[
        seeds::PROPOSAL_VAULT,
        vault_key.as_ref(),
        &[vault_bump],
    ];
    let signer_seeds = &[&vault_seeds[..]];

    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.proposal_vault.to_account_info(),
                to: ctx.accounts.voter.to_account_info(),
            },
            signer_seeds,
        ),
        total_payout,
    )?;

    // Mark as claimed
    proposal_vote.claimed = true;

    emit!(VoteTokensClaimed {
        proposal_id: proposal.proposal_id,
        voter: ctx.accounts.voter.key(),
        winner_amount,
        share_of_losing_pool: share_of_winning_pool,
        total_payout,
    });

    msg!("Claimed {} lamports for proposal {}", total_payout, proposal.proposal_id);
    msg!("Original stake: {}, Winnings from losing pool: {}", winner_amount, share_of_winning_pool);

    Ok(())
}

#[event]
pub struct VoteTokensClaimed {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub winner_amount: u64,
    pub share_of_losing_pool: u64,
    pub total_payout: u64,
}
