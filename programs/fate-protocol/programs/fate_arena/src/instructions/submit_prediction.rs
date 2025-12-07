use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
use crate::{
    Market, Match, PlayerEntry, MatchStatus, PredictionSide,
    ErrorCode, seeds, constants::PYTH_STALENESS_THRESHOLD
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SubmitPredictionParams {
    pub prediction: PredictionSide,
}

#[derive(Accounts)]
pub struct SubmitPrediction<'info> {
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
        constraint = match_account.status == MatchStatus::Open ||
                     match_account.status == MatchStatus::InProgress @ ErrorCode::InvalidMatchStatus
    )]
    pub match_account: Account<'info, Match>,

    #[account(
        mut,
        seeds = [
            seeds::PLAYER_ENTRY,
            match_account.key().as_ref(),
            player.key().as_ref()
        ],
        bump = player_entry.bump,
        constraint = player_entry.can_predict() @ ErrorCode::PredictionAlreadyLocked
    )]
    pub player_entry: Account<'info, PlayerEntry>,

    /// Pyth price update account
    pub price_update: Account<'info, PriceUpdateV2>,

    pub player: Signer<'info>,
}

pub fn handler(ctx: Context<SubmitPrediction>, params: SubmitPredictionParams) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let player_entry = &mut ctx.accounts.player_entry;
    let clock = Clock::get()?;

    // Check if within prediction window
    let prediction_deadline = match_account.created_at + match_account.prediction_window;
    require!(
        clock.unix_timestamp <= prediction_deadline,
        ErrorCode::PredictionWindowNotClosed
    );

    // Get price from Pyth
    let price_update = &ctx.accounts.price_update;
    let feed_id = get_feed_id_from_hex(&ctx.accounts.market.pyth_price_feed.to_string())?;

    let price = price_update
        .get_price_no_older_than(&clock, PYTH_STALENESS_THRESHOLD as u64, &feed_id)
        .map_err(|_| ErrorCode::StalePriceData)?;

    let current_price = price.price as u64;

    // If this is the first prediction and match hasn't started, record start price and start match
    if match_account.start_price.is_none() && match_account.status == MatchStatus::Open {
        match_account.start_price = Some(current_price);
        match_account.status = MatchStatus::InProgress;
        match_account.started_at = Some(clock.unix_timestamp);
    }

    // Record prediction
    player_entry.prediction = Some(params.prediction);
    player_entry.prediction_locked_at = Some(clock.unix_timestamp);

    emit!(PredictionSubmitted {
        match_id: match_account.match_id,
        player: ctx.accounts.player.key(),
        prediction: params.prediction,
        start_price: match_account.start_price,
    });

    Ok(())
}

#[event]
pub struct PredictionSubmitted {
    pub match_id: u64,
    pub player: Pubkey,
    pub prediction: PredictionSide,
    pub start_price: Option<u64>,
}
