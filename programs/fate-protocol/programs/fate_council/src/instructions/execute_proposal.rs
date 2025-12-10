use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::constants::{seeds, BPS_DENOMINATOR};
use crate::errors::ErrorCode as CouncilError;
use crate::state::*;

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(
        mut,
        seeds = [seeds::COUNCIL_CONFIG],
        bump = config.bump
    )]
    pub config: Account<'info, CouncilConfig>,

    #[account(
        mut,
        seeds = [seeds::PROPOSAL, proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump,
        constraint = proposal.status == ProposalStatus::Passed @ CouncilError::ProposalDidNotPass
    )]
    pub proposal: Account<'info, Proposal>,

    /// CHECK: Vault holding proposal stake + liquidity
    #[account(
        mut,
        seeds = [seeds::PROPOSAL_VAULT, proposal.key().as_ref()],
        bump
    )]
    pub proposal_vault: AccountInfo<'info>,

    /// The proposer who will receive refund + bonus
    /// CHECK: Validated against proposal.proposer
    #[account(
        mut,
        constraint = proposer.key() == proposal.proposer @ CouncilError::Unauthorized
    )]
    pub proposer: AccountInfo<'info>,

    /// CHECK: FATE Arena program for CPI
    #[account(
        constraint = fate_arena_program.key() == config.fate_arena_program
    )]
    pub fate_arena_program: AccountInfo<'info>,

    /// Remaining accounts:
    /// [0] = arena_config (for fate_arena)
    /// [1] = market (to be created)
    /// [2] = system_program
    /// etc. (all accounts needed for fate_arena::create_market CPI)

    pub executor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let config = &ctx.accounts.config;
    let clock = Clock::get()?;

    // Ensure proposal hasn't been executed yet
    require!(
        proposal.executed_at.is_none(),
        CouncilError::ProposalAlreadyExecuted
    );

    // Calculate proposer bonus
    let total_liquidity = proposal.total_liquidity();
    let proposer_bonus = (total_liquidity as u128 * config.proposer_bonus_bps as u128 / BPS_DENOMINATOR as u128) as u64;
    let proposer_total = config.proposal_stake.checked_add(proposer_bonus)
        .ok_or(CouncilError::ArithmeticOverflow)?;

    // Transfer refund + bonus to proposer
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
                to: ctx.accounts.proposer.to_account_info(),
            },
            signer_seeds,
        ),
        proposer_total,
    )?;

    // TODO: Execute CPI to fate_arena::create_market
    // This would require importing the fate_arena crate and using CpiContext
    // For now, we'll log the parameters that would be passed

    // Extract market name from fixed array
    let market_name = String::from_utf8_lossy(&proposal.market_name)
        .trim_end_matches('\0')
        .to_string();

    msg!("CPI to fate_arena::create_market would be called here");
    msg!("Market name: {}", market_name);
    msg!("Pyth feed: {}", proposal.pyth_price_feed);

    // Mark as executed
    proposal.status = ProposalStatus::Executed;
    proposal.executed_at = Some(clock.unix_timestamp);

    emit!(ProposalExecuted {
        proposal_id: proposal.proposal_id,
        proposer: proposal.proposer,
        market_name,
        proposer_bonus,
        executed_at: clock.unix_timestamp,
    });

    msg!("Proposal {} executed successfully", proposal.proposal_id);
    msg!("Proposer received {} lamports (stake + bonus)", proposer_total);

    Ok(())
}

#[event]
pub struct ProposalExecuted {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub market_name: String,
    pub proposer_bonus: u64,
    pub executed_at: i64,
}
