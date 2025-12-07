use anchor_lang::prelude::*;
use crate::{GameConfig, ErrorCode, seeds, constants::BPS_DENOMINATOR};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeConfigParams {
    pub protocol_fee_bps: u16,
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = GameConfig::LEN,
        seeds = [seeds::GAME_CONFIG],
        bump
    )]
    pub config: Account<'info, GameConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Treasury can be any account
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeConfig>, params: InitializeConfigParams) -> Result<()> {
    let config = &mut ctx.accounts.config;

    // Validate protocol fee
    require!(
        params.protocol_fee_bps <= GameConfig::MAX_PROTOCOL_FEE_BPS,
        ErrorCode::InvalidProtocolFee
    );

    config.authority = ctx.accounts.authority.key();
    config.treasury = ctx.accounts.treasury.key();
    config.protocol_fee_bps = params.protocol_fee_bps;
    config.total_matches = 0;
    config.total_volume = 0;
    config.paused = false;
    config.bump = ctx.bumps.config;

    emit!(ConfigInitialized {
        authority: config.authority,
        treasury: config.treasury,
        protocol_fee_bps: config.protocol_fee_bps,
    });

    Ok(())
}

#[event]
pub struct ConfigInitialized {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub protocol_fee_bps: u16,
}
