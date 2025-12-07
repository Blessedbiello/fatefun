use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::{
    Match, PlayerEntry, UserProfile, MatchStatus, ErrorCode, seeds
};

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(
        mut,
        seeds = [seeds::MATCH, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        constraint = match_account.status == MatchStatus::Open @ ErrorCode::InvalidMatchStatus,
        constraint = !match_account.is_full() @ ErrorCode::MatchFull
    )]
    pub match_account: Account<'info, Match>,

    #[account(
        init,
        payer = player,
        space = PlayerEntry::LEN,
        seeds = [
            seeds::PLAYER_ENTRY,
            match_account.key().as_ref(),
            player.key().as_ref()
        ],
        bump
    )]
    pub player_entry: Account<'info, PlayerEntry>,

    #[account(
        init_if_needed,
        payer = player,
        space = UserProfile::LEN,
        seeds = [seeds::USER_PROFILE, player.key().as_ref()],
        bump
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
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<JoinMatch>) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let player_entry = &mut ctx.accounts.player_entry;
    let user_profile = &mut ctx.accounts.user_profile;
    let clock = Clock::get()?;

    // Initialize player entry
    player_entry.match_account = match_account.key();
    player_entry.player = ctx.accounts.player.key();
    player_entry.prediction = None;
    player_entry.amount_staked = match_account.entry_fee;
    player_entry.prediction_locked_at = None;
    player_entry.claimed = false;
    player_entry.winnings = 0;
    player_entry.bump = ctx.bumps.player_entry;

    // Initialize user profile if new
    if user_profile.total_matches == 0 {
        user_profile.user = ctx.accounts.player.key();
        user_profile.username = None;
        user_profile.total_matches = 0;
        user_profile.wins = 0;
        user_profile.losses = 0;
        user_profile.total_wagered = 0;
        user_profile.total_won = 0;
        user_profile.current_streak = 0;
        user_profile.best_streak = 0;
        user_profile.xp = 0;
        user_profile.level = 1;
        user_profile.created_at = clock.unix_timestamp;
        user_profile.bump = ctx.bumps.user_profile;
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

    // Update match
    match_account.current_players = match_account.current_players.checked_add(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;
    match_account.total_pot = match_account.total_pot.checked_add(match_account.entry_fee)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    // If match is now full, start it immediately
    if match_account.is_full() {
        match_account.status = MatchStatus::InProgress;
        match_account.started_at = Some(clock.unix_timestamp);
    }

    emit!(PlayerJoined {
        match_id: match_account.match_id,
        player: ctx.accounts.player.key(),
        current_players: match_account.current_players,
        match_full: match_account.is_full(),
    });

    Ok(())
}

#[event]
pub struct PlayerJoined {
    pub match_id: u64,
    pub player: Pubkey,
    pub current_players: u8,
    pub match_full: bool,
}
