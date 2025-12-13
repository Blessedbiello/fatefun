use anchor_lang::prelude::*;
use crate::{
    Market, Match, PlayerEntry, MatchStatus, PredictionSide,
    ErrorCode, seeds, utils::pyth::*,
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

    /// CHECK: Pyth price update account - validated in handler via validate_price_feed() and get_pyth_price()
    pub price_update: AccountInfo<'info>,

    pub player: Signer<'info>,
}

pub fn handler(ctx: Context<SubmitPrediction>, params: SubmitPredictionParams) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let player_entry = &mut ctx.accounts.player_entry;
    let market = &ctx.accounts.market;
    let clock = Clock::get()?;

    // Check if within prediction window
    let prediction_deadline = match_account.created_at + match_account.prediction_window;
    require!(
        clock.unix_timestamp <= prediction_deadline,
        ErrorCode::PredictionWindowNotClosed
    );

    // Get feed ID from market
    let feed_id_hex = market.pyth_price_feed.to_string();

    // Validate the price update account contains the correct feed
    validate_price_feed(&ctx.accounts.price_update.to_account_info(), &feed_id_hex)?;

    // If this is the first prediction and match hasn't started, record start price
    if match_account.start_price.is_none() && match_account.status == MatchStatus::Open {

        // Get current price from Pyth
        let pyth_price = get_pyth_price(
            &ctx.accounts.price_update,
            &feed_id_hex,
            &clock,
        )?;

        msg!(
            "Start price set: {} (raw: {}, exp: {}, conf: {})",
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

        // Record start price and start the match
        match_account.start_price = Some(pyth_price.normalized_price);
        match_account.status = MatchStatus::InProgress;
        match_account.started_at = Some(clock.unix_timestamp);
    }

    // Record player's prediction
    player_entry.prediction = Some(params.prediction);
    player_entry.prediction_locked_at = Some(clock.unix_timestamp);

    emit!(PredictionSubmitted {
        match_id: match_account.match_id,
        player: ctx.accounts.player.key(),
        prediction: params.prediction,
        start_price: match_account.start_price,
        locked_at: clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct PredictionSubmitted {
    pub match_id: u64,
    pub player: Pubkey,
    pub prediction: PredictionSide,
    pub start_price: Option<u64>,
    pub locked_at: i64,
}
