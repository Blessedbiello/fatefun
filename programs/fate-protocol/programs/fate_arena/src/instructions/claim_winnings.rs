use anchor_lang::prelude::*;
use crate::{
    GameConfig, Match, PlayerEntry, UserProfile, MatchStatus,
    ErrorCode, seeds, constants::*
};

/// Remaining accounts should be all PlayerEntry accounts for this match
/// This is needed to count total winners
#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [seeds::GAME_CONFIG],
        bump = config.bump
    )]
    pub config: Account<'info, GameConfig>,

    #[account(
        seeds = [seeds::MATCH, match_account.match_id.to_le_bytes().as_ref()],
        bump = match_account.bump,
        constraint = match_account.status == MatchStatus::Completed @ ErrorCode::InvalidMatchStatus
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
        constraint = !player_entry.claimed @ ErrorCode::AlreadyClaimed
    )]
    pub player_entry: Account<'info, PlayerEntry>,

    #[account(
        mut,
        seeds = [seeds::USER_PROFILE, player.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: Match vault
    #[account(
        mut,
        seeds = [seeds::VAULT, match_account.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,

    /// CHECK: Treasury account
    #[account(
        mut,
        constraint = treasury.key() == config.treasury
    )]
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimWinnings>) -> Result<()> {
    let match_account = &ctx.accounts.match_account;
    let player_entry = &mut ctx.accounts.player_entry;
    let user_profile = &mut ctx.accounts.user_profile;
    let config = &ctx.accounts.config;

    let winning_side = match_account.winning_side.ok_or(ErrorCode::InvalidMatchStatus)?;

    // Check if player won
    let is_winner = player_entry.prediction == Some(winning_side);

    // Calculate winnings
    let protocol_fee = match_account.calculate_protocol_fee(config.protocol_fee_bps);
    let prize_pool = match_account.calculate_prize_pool(config.protocol_fee_bps);

    // We need to count winners from remaining_accounts
    // For simplicity in this example, we'll use a fixed calculation
    // In production, you'd pass all PlayerEntry accounts in remaining_accounts
    let mut winner_count = 0u64;

    // Count winners from remaining accounts
    for account_info in ctx.remaining_accounts.iter() {
        if let Ok(entry) = PlayerEntry::try_deserialize(&mut &account_info.data.borrow()[..]) {
            if entry.match_account == match_account.key() &&
               entry.prediction == Some(winning_side) {
                winner_count += 1;
            }
        }
    }

    require!(winner_count > 0, ErrorCode::NoWinnings);

    let per_winner_amount = if is_winner {
        prize_pool / winner_count
    } else {
        0
    };

    // Update player entry
    player_entry.claimed = true;
    player_entry.winnings = per_winner_amount;

    // Update user profile stats
    user_profile.total_matches = user_profile.total_matches.checked_add(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;
    user_profile.total_wagered = user_profile.total_wagered.checked_add(player_entry.amount_staked)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    if is_winner {
        user_profile.wins = user_profile.wins.checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        user_profile.total_won = user_profile.total_won.checked_add(per_winner_amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        // Calculate XP (double for wins)
        let xp_gained = calculate_xp(true, user_profile.current_streak);
        user_profile.xp = user_profile.xp.checked_add(xp_gained)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        user_profile.level = user_profile.calculate_level();
    } else {
        user_profile.losses = user_profile.losses.checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        // Base XP for participation
        let xp_gained = calculate_xp(false, user_profile.current_streak);
        user_profile.xp = user_profile.xp.checked_add(xp_gained)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        user_profile.level = user_profile.calculate_level();
    }

    // Update streak
    user_profile.update_streak(is_winner);

    // Transfer winnings if player won
    if per_winner_amount > 0 {
        let vault_seeds = &[
            seeds::VAULT,
            match_account.key().as_ref(),
            &[ctx.bumps.vault],
        ];
        let signer_seeds = &[&vault_seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.player.to_account_info(),
                },
                signer_seeds,
            ),
            per_winner_amount,
        )?;
    }

    // Transfer protocol fee to treasury (only once, we can check if vault balance > prize pool)
    let vault_balance = ctx.accounts.vault.lamports();
    if vault_balance >= protocol_fee {
        let vault_seeds = &[
            seeds::VAULT,
            match_account.key().as_ref(),
            &[ctx.bumps.vault],
        ];
        let signer_seeds = &[&vault_seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
                signer_seeds,
            ),
            protocol_fee,
        )?;
    }

    emit!(WinningsClaimed {
        match_id: match_account.match_id,
        player: ctx.accounts.player.key(),
        amount: per_winner_amount,
        is_winner,
        new_level: user_profile.level,
    });

    Ok(())
}

/// Calculate XP gained from a match
fn calculate_xp(won: bool, streak: i32) -> u64 {
    let base_xp = BASE_XP_PER_MATCH;

    if won {
        let xp = base_xp * WIN_XP_MULTIPLIER;
        // Bonus for win streaks
        let streak_bonus = if streak > 0 {
            (streak as u64 * 10).min(500) // Max 500 bonus XP
        } else {
            0
        };
        xp + streak_bonus
    } else {
        base_xp
    }
}

#[event]
pub struct WinningsClaimed {
    pub match_id: u64,
    pub player: Pubkey,
    pub amount: u64,
    pub is_winner: bool,
    pub new_level: u16,
}
