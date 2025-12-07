use anchor_lang::prelude::*;
use crate::constants::*;
use crate::state::*;

#[derive(Accounts)]
pub struct UpdateStats<'info> {
    #[account(
        mut,
        seeds = [PLAYER_SEED, player.key().as_ref()],
        bump = player_account.bump
    )]
    pub player_account: Account<'info, Player>,

    pub player: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateStats>) -> Result<()> {
    let player_account = &mut ctx.accounts.player_account;

    // Stats are updated in other instructions
    // This can be used for manual stat recalculation if needed

    msg!("Player stats updated: {}", ctx.accounts.player.key());

    Ok(())
}
