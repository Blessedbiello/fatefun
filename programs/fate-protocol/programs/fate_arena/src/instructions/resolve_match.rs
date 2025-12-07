use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
use crate::{
    GameConfig, Market, Match, MatchStatus, PredictionSide,
    ErrorCode, seeds, constants::PYTH_STALENESS_THRESHOLD
};

#[derive(Accounts)]
pub struct ResolveMatch<'info> {
    #[account(
        mut,
        seeds = [seeds::GAME_CONFIG],
        bump = config.bump
    )]
    pub config: Account<'info, GameConfig>,

    #[account(
        seeds = [seeds::MARKET, market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [seeds::MATCH, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        has_one = market,
        constraint = match_account.status == MatchStatus::InProgress @ ErrorCode::InvalidMatchStatus,
        constraint = match_account.can_resolve() @ ErrorCode::ResolutionTimeNotReached
    )]
    pub match_account: Account<'info, Match>,

    /// Pyth price update account
    pub price_update: Account<'info, PriceUpdateV2>,

    pub resolver: Signer<'info>,
}

pub fn handler(ctx: Context<ResolveMatch>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let match_account = &mut ctx.accounts.match_account;
    let clock = Clock::get()?;

    // Get end price from Pyth
    let price_update = &ctx.accounts.price_update;
    let feed_id = get_feed_id_from_hex(&ctx.accounts.market.pyth_price_feed.to_string())?;

    let price = price_update
        .get_price_no_older_than(&clock, PYTH_STALENESS_THRESHOLD as u64, &feed_id)
        .map_err(|_| ErrorCode::StalePriceData)?;

    let end_price = price.price as u64;
    let start_price = match_account.start_price.ok_or(ErrorCode::MatchNotStarted)?;

    // Determine winning side
    let winning_side = if end_price > start_price {
        PredictionSide::Higher
    } else if end_price < start_price {
        PredictionSide::Lower
    } else {
        // If price is exactly the same, Higher wins (house rule)
        PredictionSide::Higher
    };

    // Update match
    match_account.end_price = Some(end_price);
    match_account.winning_side = Some(winning_side);
    match_account.status = MatchStatus::Completed;
    match_account.resolved_at = Some(clock.unix_timestamp);

    // Update global stats
    config.total_volume = config.total_volume.checked_add(match_account.total_pot)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    emit!(MatchResolved {
        match_id: match_account.match_id,
        start_price,
        end_price,
        winning_side,
        total_pot: match_account.total_pot,
    });

    Ok(())
}

#[event]
pub struct MatchResolved {
    pub match_id: u64,
    pub start_price: u64,
    pub end_price: u64,
    pub winning_side: PredictionSide,
    pub total_pot: u64,
}
