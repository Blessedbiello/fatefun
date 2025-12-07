use anchor_lang::prelude::*;
use crate::constants::seeds;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeCouncilParams {
    /// FATE Arena program ID for CPI calls
    pub fate_arena_program: Pubkey,
    /// SOL required to create proposals (default: 1 SOL)
    pub proposal_stake: Option<u64>,
    /// Voting period in seconds (default: 48 hours)
    pub voting_period: Option<i64>,
    /// Proposer bonus in basis points (default: 200 = 2%)
    pub proposer_bonus_bps: Option<u16>,
}

#[derive(Accounts)]
pub struct InitializeCouncil<'info> {
    #[account(
        init,
        payer = authority,
        space = CouncilConfig::LEN,
        seeds = [seeds::COUNCIL_CONFIG],
        bump
    )]
    pub config: Account<'info, CouncilConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeCouncil>, params: InitializeCouncilParams) -> Result<()> {
    let config = &mut ctx.accounts.config;

    config.authority = ctx.accounts.authority.key();
    config.fate_arena_program = params.fate_arena_program;
    config.proposal_stake = params.proposal_stake.unwrap_or(CouncilConfig::DEFAULT_PROPOSAL_STAKE);
    config.voting_period = params.voting_period.unwrap_or(CouncilConfig::DEFAULT_VOTING_PERIOD);
    config.total_proposals = 0;
    config.proposer_bonus_bps = params.proposer_bonus_bps.unwrap_or(CouncilConfig::DEFAULT_PROPOSER_BONUS_BPS);
    config.bump = ctx.bumps.config;

    msg!("Council initialized with futarchy governance");
    msg!("Proposal stake: {} lamports", config.proposal_stake);
    msg!("Voting period: {} seconds", config.voting_period);

    Ok(())
}

#[event]
pub struct CouncilInitialized {
    pub authority: Pubkey,
    pub fate_arena_program: Pubkey,
    pub proposal_stake: u64,
    pub voting_period: i64,
}
