use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct JoinMatchParams {
    pub prediction: PredictionOutcome,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(
        mut,
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        constraint = match_account.state == MatchState::Pending @ FateArenaError::InvalidMatchState,
        constraint = match_account.player_count < match_account.max_players @ FateArenaError::MatchFull
    )]
    pub match_account: Account<'info, Match>,

    #[account(
        init_if_needed,
        payer = player,
        space = Player::LEN,
        seeds = [PLAYER_SEED, player.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, Player>,

    #[account(
        init,
        payer = player,
        space = Prediction::LEN,
        seeds = [
            PREDICTION_SEED,
            match_account.key().as_ref(),
            player.key().as_ref()
        ],
        bump
    )]
    pub prediction: Account<'info, Prediction>,

    /// CHECK: Match vault to hold entry fees
    #[account(
        mut,
        seeds = [VAULT_SEED, match_account.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<JoinMatch>, params: JoinMatchParams) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let player_account = &mut ctx.accounts.player_account;
    let prediction = &mut ctx.accounts.prediction;

    // Initialize player account if new
    if player_account.matches_played == 0 {
        player_account.wallet = ctx.accounts.player.key();
        player_account.matches_played = 0;
        player_account.matches_won = 0;
        player_account.total_winnings = 0;
        player_account.total_losses = 0;
        player_account.win_streak = 0;
        player_account.best_win_streak = 0;
        player_account.level = 1;
        player_account.xp = 0;
        player_account.created_at = Clock::get()?.unix_timestamp;
        player_account.last_match_at = 0;
        player_account.bump = ctx.bumps.player_account;
    }

    // Transfer entry fee to vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        match_account.entry_fee,
    )?;

    // Initialize prediction
    prediction.match_account = match_account.key();
    prediction.player = ctx.accounts.player.key();
    prediction.outcome = params.prediction;
    prediction.wager = match_account.entry_fee;
    prediction.is_winner = false;
    prediction.payout = 0;
    prediction.claimed = false;
    prediction.predicted_at = Clock::get()?.unix_timestamp;
    prediction.bump = ctx.bumps.prediction;

    // Update match
    match_account.player_count = match_account.player_count.checked_add(1).unwrap();
    match_account.prize_pool = match_account.prize_pool.checked_add(match_account.entry_fee).unwrap();

    // Update player stats
    player_account.last_match_at = Clock::get()?.unix_timestamp;

    msg!(
        "Player {} joined match {} with prediction {:?}",
        ctx.accounts.player.key(),
        match_account.match_id,
        params.prediction
    );

    Ok(())
}
