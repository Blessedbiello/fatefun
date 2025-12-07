use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::constants::{seeds, MIN_TRADE_AMOUNT, MAX_TRADE_AMOUNT};
use crate::errors::*;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum OutcomeSide {
    Pass,
    Fail,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct TradeOutcomeParams {
    pub outcome: OutcomeSide,
    pub amount: u64,
}

#[derive(Accounts)]
pub struct TradeOutcome<'info> {
    #[account(
        mut,
        seeds = [seeds::PROPOSAL, proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump,
        constraint = proposal.status == ProposalStatus::Active @ ErrorCode::ProposalNotActive
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init_if_needed,
        payer = trader,
        space = ProposalVote::LEN,
        seeds = [seeds::PROPOSAL_VOTE, proposal.key().as_ref(), trader.key().as_ref()],
        bump
    )]
    pub proposal_vote: Account<'info, ProposalVote>,

    /// CHECK: Vault PDA holding proposal liquidity
    #[account(
        mut,
        seeds = [seeds::PROPOSAL_VAULT, proposal.key().as_ref()],
        bump
    )]
    pub proposal_vault: AccountInfo<'info>,

    #[account(mut)]
    pub trader: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<TradeOutcome>, params: TradeOutcomeParams) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let proposal_vote = &mut ctx.accounts.proposal_vote;
    let clock = Clock::get()?;

    // Validate voting period is active
    require!(
        clock.unix_timestamp < proposal.voting_ends_at,
        ErrorCode::VotingPeriodEnded
    );

    // Validate trade amount
    require!(
        params.amount >= MIN_TRADE_AMOUNT,
        ErrorCode::TradeAmountTooSmall
    );
    require!(
        params.amount <= MAX_TRADE_AMOUNT,
        ErrorCode::TradeAmountTooLarge
    );

    // Transfer SOL to vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.trader.to_account_info(),
                to: ctx.accounts.proposal_vault.to_account_info(),
            },
        ),
        params.amount,
    )?;

    // Initialize ProposalVote if needed
    if !proposal_vote.has_position() {
        proposal_vote.proposal = proposal.key();
        proposal_vote.voter = ctx.accounts.trader.key();
        proposal_vote.pass_amount = 0;
        proposal_vote.fail_amount = 0;
        proposal_vote.claimed = false;
        proposal_vote.bump = ctx.bumps.proposal_vote;
    }

    // Update pools and user position
    match params.outcome {
        OutcomeSide::Pass => {
            proposal.pass_pool = proposal.pass_pool.checked_add(params.amount)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
            proposal_vote.pass_amount = proposal_vote.pass_amount.checked_add(params.amount)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
        }
        OutcomeSide::Fail => {
            proposal.fail_pool = proposal.fail_pool.checked_add(params.amount)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
            proposal_vote.fail_amount = proposal_vote.fail_amount.checked_add(params.amount)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
        }
    }

    // Recalculate prices based on new pool sizes
    proposal.calculate_prices();

    emit!(OutcomeTraded {
        proposal_id: proposal.proposal_id,
        trader: ctx.accounts.trader.key(),
        outcome: params.outcome,
        amount: params.amount,
        pass_pool: proposal.pass_pool,
        fail_pool: proposal.fail_pool,
        pass_price: proposal.pass_price,
        fail_price: proposal.fail_price,
    });

    msg!(
        "Traded {} lamports for {:?} outcome on proposal {}",
        params.amount,
        params.outcome,
        proposal.proposal_id
    );
    msg!("New prices - Pass: {} bps, Fail: {} bps", proposal.pass_price, proposal.fail_price);

    Ok(())
}

#[event]
pub struct OutcomeTraded {
    pub proposal_id: u64,
    pub trader: Pubkey,
    pub outcome: OutcomeSide,
    pub amount: u64,
    pub pass_pool: u64,
    pub fail_pool: u64,
    pub pass_price: u64,
    pub fail_price: u64,
}
