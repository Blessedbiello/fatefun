use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::{
    GameConfig, Market, Match, PlayerEntry, UserProfile,
    MatchType, MatchStatus, ErrorCode, seeds, constants::*
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateMatchParams {
    pub match_type: MatchType,
    pub entry_fee: u64,
    pub max_players: u8,
    pub prediction_window: i64,
    pub match_duration: i64,
}

#[derive(Accounts)]
pub struct CreateMatch<'info> {
    #[account(
        mut,
        seeds = [seeds::GAME_CONFIG],
        bump = config.bump,
        constraint = !config.paused @ ErrorCode::GamePaused
    )]
    pub config: Account<'info, GameConfig>,

    #[account(
        mut,
        seeds = [seeds::MARKET, market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.active @ ErrorCode::MarketNotActive
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = creator,
        space = Match::LEN,
        seeds = [seeds::MATCH, config.total_matches.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    #[account(
        init,
        payer = creator,
        space = PlayerEntry::LEN,
        seeds = [
            seeds::PLAYER_ENTRY,
            match_account.key().as_ref(),
            creator.key().as_ref()
        ],
        bump
    )]
    pub player_entry: Account<'info, PlayerEntry>,

    #[account(
        mut,
        seeds = [seeds::USER_PROFILE, creator.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: Match escrow vault
    #[account(
        mut,
        seeds = [seeds::VAULT, match_account.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateMatch>, params: CreateMatchParams) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let market = &mut ctx.accounts.market;
    let match_account = &mut ctx.accounts.match_account;
    let player_entry = &mut ctx.accounts.player_entry;
    let user_profile = &mut ctx.accounts.user_profile;
    let clock = Clock::get()?;

    // Validate parameters
    require!(
        params.entry_fee >= MIN_ENTRY_FEE && params.entry_fee <= MAX_ENTRY_FEE,
        ErrorCode::InvalidEntryFee
    );
    require!(
        params.max_players >= 2 && params.max_players <= MAX_PLAYERS,
        ErrorCode::InvalidMaxPlayers
    );
    require!(
        params.prediction_window >= MIN_PREDICTION_WINDOW &&
        params.prediction_window <= MAX_PREDICTION_WINDOW,
        ErrorCode::InvalidPredictionWindow
    );
    require!(
        params.match_duration >= MIN_MATCH_DURATION &&
        params.match_duration <= MAX_MATCH_DURATION,
        ErrorCode::InvalidPredictionWindow
    );

    // Validate match type
    if params.match_type == MatchType::BattleRoyale {
        require!(
            params.max_players >= MIN_BATTLE_ROYALE_PLAYERS,
            ErrorCode::InvalidMaxPlayers
        );
    }

    let match_id = config.total_matches;

    // Initialize match
    match_account.match_id = match_id;
    match_account.market = market.key();
    match_account.creator = ctx.accounts.creator.key();
    match_account.match_type = params.match_type;
    match_account.entry_fee = params.entry_fee;
    match_account.max_players = params.max_players;
    match_account.current_players = 1; // Creator joins
    match_account.status = MatchStatus::Open;
    match_account.start_price = None;
    match_account.end_price = None;
    match_account.prediction_window = params.prediction_window;
    match_account.resolution_time = clock.unix_timestamp + params.prediction_window + params.match_duration;
    match_account.winning_side = None;
    match_account.total_pot = params.entry_fee;
    match_account.created_at = clock.unix_timestamp;
    match_account.started_at = None;
    match_account.resolved_at = None;
    match_account.bump = ctx.bumps.match_account;

    // Initialize player entry for creator
    player_entry.match_account = match_account.key();
    player_entry.player = ctx.accounts.creator.key();
    player_entry.prediction = None;
    player_entry.amount_staked = params.entry_fee;
    player_entry.prediction_locked_at = None;
    player_entry.claimed = false;
    player_entry.winnings = 0;
    player_entry.bump = ctx.bumps.player_entry;

    // Transfer entry fee to vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        params.entry_fee,
    )?;

    // Update counters
    config.total_matches = config.total_matches.checked_add(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;
    market.total_matches = market.total_matches.checked_add(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    emit!(MatchCreated {
        match_id,
        market: market.key(),
        creator: ctx.accounts.creator.key(),
        match_type: params.match_type,
        entry_fee: params.entry_fee,
        max_players: params.max_players,
    });

    Ok(())
}

#[event]
pub struct MatchCreated {
    pub match_id: u64,
    pub market: Pubkey,
    pub creator: Pubkey,
    pub match_type: MatchType,
    pub entry_fee: u64,
    pub max_players: u8,
}
