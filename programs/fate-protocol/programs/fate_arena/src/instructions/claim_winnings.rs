use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [ARENA_SEED],
        bump = arena.bump
    )]
    pub arena: Account<'info, Arena>,

    #[account(
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        constraint = match_account.state == MatchState::Resolved @ FateArenaError::InvalidMatchState
    )]
    pub match_account: Account<'info, Match>,

    #[account(
        mut,
        seeds = [PLAYER_SEED, player.key().as_ref()],
        bump = player_account.bump
    )]
    pub player_account: Account<'info, Player>,

    #[account(
        mut,
        seeds = [
            PREDICTION_SEED,
            match_account.key().as_ref(),
            player.key().as_ref()
        ],
        bump = prediction.bump,
        constraint = !prediction.claimed @ FateArenaError::AlreadyClaimed
    )]
    pub prediction: Account<'info, Prediction>,

    /// CHECK: Match vault
    #[account(
        mut,
        seeds = [VAULT_SEED, match_account.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,

    /// CHECK: Treasury account
    #[account(
        mut,
        constraint = treasury.key() == arena.treasury
    )]
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimWinnings>) -> Result<()> {
    let match_account = &ctx.accounts.match_account;
    let prediction = &mut ctx.accounts.prediction;
    let arena = &mut ctx.accounts.arena;

    // Check if prediction won
    let winning_outcome = match_account.winning_outcome
        .ok_or(FateArenaError::InvalidMatchState)?;

    require!(
        prediction.outcome == winning_outcome,
        FateArenaError::NoWinnings
    );

    // Calculate payout
    // This is a simplified calculation - in production you'd track winner count
    let total_pool = match_account.prize_pool;
    let platform_fee = total_pool
        .checked_mul(arena.platform_fee_bps as u64)
        .unwrap()
        .checked_div(BASIS_POINTS as u64)
        .unwrap();
    let treasury_fee = total_pool
        .checked_mul(arena.treasury_fee_bps as u64)
        .unwrap()
        .checked_div(BASIS_POINTS as u64)
        .unwrap();

    let payout_pool = total_pool
        .checked_sub(platform_fee)
        .unwrap()
        .checked_sub(treasury_fee)
        .unwrap();

    // For this example, split evenly among winners
    // In production, you'd need to track total winners
    let payout = payout_pool / (match_account.winner_count.max(1) as u64);

    // Transfer winnings
    let vault_seeds = &[
        VAULT_SEED,
        match_account.key().as_ref(),
        &[ctx.bumps.vault],
    ];
    let signer_seeds = &[&vault_seeds[..]];

    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.player.to_account_info(),
            },
            signer_seeds,
        ),
        payout,
    )?;

    // Transfer fees to treasury
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
            signer_seeds,
        ),
        platform_fee + treasury_fee,
    )?;

    // Update prediction
    prediction.is_winner = true;
    prediction.payout = payout;
    prediction.claimed = true;

    // Update player stats
    let player_account = &mut ctx.accounts.player_account;
    player_account.total_winnings = player_account.total_winnings.checked_add(payout).unwrap();

    // Update arena stats
    arena.total_fees = arena.total_fees.checked_add(platform_fee + treasury_fee).unwrap();

    msg!("Player {} claimed {} lamports", ctx.accounts.player.key(), payout);

    Ok(())
}
