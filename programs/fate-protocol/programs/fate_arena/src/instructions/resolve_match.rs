use anchor_lang::prelude::*;
use pyth_sdk_solana::load_price_feed_from_account_info;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct ResolveMatch<'info> {
    #[account(
        mut,
        seeds = [ARENA_SEED],
        bump = arena.bump
    )]
    pub arena: Account<'info, Arena>,

    #[account(
        mut,
        seeds = [MATCH_SEED, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        constraint = match_account.state == MatchState::Active @ FateArenaError::InvalidMatchState
    )]
    pub match_account: Account<'info, Match>,

    /// CHECK: Pyth price feed account
    #[account(
        constraint = price_feed.key() == match_account.price_feed @ FateArenaError::InvalidPriceFeed
    )]
    pub price_feed: AccountInfo<'info>,

    pub resolver: Signer<'info>,
}

pub fn handler(ctx: Context<ResolveMatch>) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let arena = &mut ctx.accounts.arena;
    let clock = Clock::get()?;

    // Check if match has ended
    require!(
        clock.unix_timestamp >= match_account.end_time,
        FateArenaError::MatchNotEnded
    );

    // Check resolution window
    require!(
        clock.unix_timestamp <= match_account.end_time + RESOLUTION_WINDOW,
        FateArenaError::ResolutionWindowPassed
    );

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

    match_account.exit_price = current_price.price;
    match_account.state = MatchState::Ended;

    // Determine winning outcome based on market type
    let winning_outcome = match match_account.market_type {
        MarketType::PriceDirection => {
            if match_account.exit_price > match_account.entry_price {
                PredictionOutcome::Up
            } else {
                PredictionOutcome::Down
            }
        },
        MarketType::PriceTarget => {
            if match_account.exit_price >= match_account.target_price {
                PredictionOutcome::TargetHit
            } else {
                PredictionOutcome::TargetMissed
            }
        },
        MarketType::PriceRange => {
            if match_account.exit_price >= match_account.range_min
                && match_account.exit_price <= match_account.range_max {
                PredictionOutcome::InRange
            } else {
                PredictionOutcome::OutOfRange
            }
        },
    };

    match_account.winning_outcome = Some(winning_outcome);
    match_account.state = MatchState::Resolved;
    match_account.resolved_at = clock.unix_timestamp;

    // Update arena stats
    arena.active_matches = arena.active_matches.saturating_sub(1);
    arena.total_volume = arena.total_volume.checked_add(match_account.prize_pool).unwrap();

    msg!(
        "Match {} resolved. Entry: {}, Exit: {}, Winner: {:?}",
        match_account.match_id,
        match_account.entry_price,
        match_account.exit_price,
        winning_outcome
    );

    Ok(())
}
