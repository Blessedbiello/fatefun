use anchor_lang::prelude::*;
use crate::constants::*;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeParams {
    pub platform_fee_bps: u16,
    pub treasury_fee_bps: u16,
    pub min_bet: u64,
    pub max_bet: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = Arena::LEN,
        seeds = [ARENA_SEED],
        bump
    )]
    pub arena: Account<'info, Arena>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Treasury account
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
    let arena = &mut ctx.accounts.arena;

    arena.authority = ctx.accounts.authority.key();
    arena.treasury = ctx.accounts.treasury.key();
    arena.total_matches = 0;
    arena.active_matches = 0;
    arena.total_volume = 0;
    arena.total_fees = 0;
    arena.platform_fee_bps = params.platform_fee_bps;
    arena.treasury_fee_bps = params.treasury_fee_bps;
    arena.min_bet = params.min_bet;
    arena.max_bet = params.max_bet;
    arena.paused = false;
    arena.bump = ctx.bumps.arena;

    msg!("Arena initialized with authority: {}", arena.authority);

    Ok(())
}
