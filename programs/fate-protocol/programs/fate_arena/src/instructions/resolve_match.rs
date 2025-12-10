use anchor_lang::prelude::*;
use crate::{
    GameConfig, Market, Match, MatchStatus, PredictionSide,
    ErrorCode, seeds, utils::pyth::*,
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
    pub price_update: AccountInfo<'info>,

    pub resolver: Signer<'info>,
}

pub fn handler(ctx: Context<ResolveMatch>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let match_account = &mut ctx.accounts.match_account;
    let market = &ctx.accounts.market;
    let clock = Clock::get()?;

    // Get start price
    let start_price = match_account.start_price.ok_or(ErrorCode::MatchNotStarted)?;

    // Get feed ID from market
    let feed_id_hex = market.pyth_price_feed.to_string();

    // Validate the price update account contains the correct feed
    validate_price_feed(&ctx.accounts.price_update.to_account_info(), &feed_id_hex)?;

    // Convert Anchor Clock to PythClock for Pyth

    // Get end price from Pyth with full validation
    let pyth_price = get_pyth_price(
        &ctx.accounts.price_update,
        &feed_id_hex,
        &clock,
    )?;

    msg!(
        "End price: {} (raw: {}, exp: {}, conf: {})",
        pyth_price.normalized_price,
        pyth_price.price,
        pyth_price.exponent,
        pyth_price.confidence
    );

    // Validate confidence interval
    require!(
        pyth_price.is_confidence_acceptable(),
        ErrorCode::ConfidenceIntervalTooWide
    );

    let end_price = pyth_price.normalized_price;

    // Compare prices to determine winner
    let price_comparison = compare_prices(start_price, end_price);

    let winning_side = match price_comparison {
        PriceComparison::Higher => {
            msg!("Price went UP: {} -> {}", start_price, end_price);
            Some(PredictionSide::Higher)
        },
        PriceComparison::Lower => {
            msg!("Price went DOWN: {} -> {}", start_price, end_price);
            Some(PredictionSide::Lower)
        },
        PriceComparison::Equal => {
            // Edge case: price is exactly the same
            // No winners, all players will get refunds in claim_winnings
            msg!("Price stayed EQUAL: {} = {} (REFUND ALL)", start_price, end_price);
            None
        },
    };

    // Update match state
    match_account.end_price = Some(end_price);
    match_account.winning_side = winning_side;
    match_account.status = MatchStatus::Completed;
    match_account.resolved_at = Some(clock.unix_timestamp);

    // Update global stats
    config.total_volume = config.total_volume
        .checked_add(match_account.total_pot)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    emit!(MatchResolved {
        match_id: match_account.match_id,
        start_price,
        end_price,
        winning_side,
        total_pot: match_account.total_pot,
        price_change: if end_price > start_price {
            (end_price - start_price) as i64
        } else {
            -((start_price - end_price) as i64)
        },
    });

    Ok(())
}

#[event]
pub struct MatchResolved {
    pub match_id: u64,
    pub start_price: u64,
    pub end_price: u64,
    pub winning_side: Option<PredictionSide>,
    pub total_pot: u64,
    pub price_change: i64,
}
