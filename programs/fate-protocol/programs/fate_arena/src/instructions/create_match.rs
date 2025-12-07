use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateMatchParams {
    pub market_type: MarketType,
    pub asset_symbol: [u8; 16],
    pub entry_fee: u64,
    pub max_players: u8,
    pub duration: i64,
    pub target_price: Option<i64>,
    pub range_min: Option<i64>,
    pub range_max: Option<i64>,
}

#[derive(Accounts)]
pub struct CreateMatch<'info> {
    #[account(
        mut,
        seeds = [ARENA_SEED],
        bump = arena.bump
    )]
    pub arena: Account<'info, Arena>,

    #[account(
        init,
        payer = creator,
        space = Match::LEN,
        seeds = [MATCH_SEED, arena.total_matches.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: Pyth price feed account
    pub price_feed: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateMatch>, params: CreateMatchParams) -> Result<()> {
    let arena = &mut ctx.accounts.arena;
    let match_account = &mut ctx.accounts.match_account;

    // Validate parameters
    require!(
        params.entry_fee >= arena.min_bet && params.entry_fee <= arena.max_bet,
        FateArenaError::InvalidBetAmount
    );
    require!(
        params.max_players >= MIN_PLAYERS && params.max_players <= MAX_PLAYERS,
        FateArenaError::InvalidMatchDuration
    );
    require!(
        params.duration >= 60 && params.duration <= 3600,
        FateArenaError::InvalidMatchDuration
    );

    let match_id = arena.total_matches;

    // Initialize match
    match_account.match_id = match_id;
    match_account.creator = ctx.accounts.creator.key();
    match_account.state = MatchState::Pending;
    match_account.market_type = params.market_type;
    match_account.price_feed = ctx.accounts.price_feed.key();
    match_account.asset_symbol = params.asset_symbol;
    match_account.entry_price = 0;
    match_account.exit_price = 0;
    match_account.target_price = params.target_price.unwrap_or(0);
    match_account.range_min = params.range_min.unwrap_or(0);
    match_account.range_max = params.range_max.unwrap_or(0);
    match_account.entry_fee = params.entry_fee;
    match_account.prize_pool = 0;
    match_account.player_count = 0;
    match_account.max_players = params.max_players;
    match_account.start_time = 0;
    match_account.end_time = 0;
    match_account.duration = params.duration;
    match_account.winning_outcome = None;
    match_account.winner_count = 0;
    match_account.resolved_at = 0;
    match_account.bump = ctx.bumps.match_account;

    // Update arena stats
    arena.total_matches = arena.total_matches.checked_add(1).unwrap();
    arena.active_matches = arena.active_matches.checked_add(1).unwrap();

    msg!("Match {} created by {}", match_id, ctx.accounts.creator.key());

    Ok(())
}
