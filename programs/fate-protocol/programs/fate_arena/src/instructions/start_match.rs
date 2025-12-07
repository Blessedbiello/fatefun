use anchor_lang::prelude::*;
use pyth_sdk_solana::load_price_feed_from_account_info;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct StartMatch<'info> {
    #[account(
        mut,
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        constraint = match_account.state == MatchState::Pending @ FateArenaError::InvalidMatchState,
        constraint = match_account.player_count >= MIN_PLAYERS @ FateArenaError::NotEnoughPlayers
    )]
    pub match_account: Account<'info, Match>,

    /// CHECK: Pyth price feed account
    #[account(
        constraint = price_feed.key() == match_account.price_feed @ FateArenaError::InvalidPriceFeed
    )]
    pub price_feed: AccountInfo<'info>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<StartMatch>) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let clock = Clock::get()?;

    // Load Pyth price feed
    let price_feed = load_price_feed_from_account_info(&ctx.accounts.price_feed)
        .map_err(|_| FateArenaError::InvalidPriceFeed)?;

    let current_price = price_feed
        .get_current_price()
        .ok_or(FateArenaError::InvalidPriceFeed)?;

    // Check price staleness
    let price_age = clock.unix_timestamp - current_price.publish_time;
    require!(
        price_age < PYTH_STALENESS_THRESHOLD as i64,
        FateArenaError::StalePriceFeed
    );

    // Update match state
    match_account.state = MatchState::Active;
    match_account.entry_price = current_price.price;
    match_account.start_time = clock.unix_timestamp;
    match_account.end_time = clock.unix_timestamp + match_account.duration;

    msg!(
        "Match {} started at price {} (expo: {})",
        match_account.match_id,
        current_price.price,
        current_price.expo
    );

    Ok(())
}
