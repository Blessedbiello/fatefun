use anchor_lang::prelude::*;
use crate::{UserProfile, ErrorCode, seeds};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateUserProfileParams {
    pub username: Option<String>,
}

#[derive(Accounts)]
pub struct UpdateUserProfile<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = UserProfile::LEN,
        seeds = [seeds::USER_PROFILE, user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateUserProfile>, params: UpdateUserProfileParams) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let clock = Clock::get()?;

    // Initialize if new profile
    if user_profile.total_matches == 0 {
        user_profile.user = ctx.accounts.user.key();
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

    // Update username if provided
    if let Some(username) = params.username {
        require!(username.len() <= 32, ErrorCode::UsernameTooLong);

        // Validate username characters (alphanumeric and underscores only)
        require!(
            username.chars().all(|c| c.is_alphanumeric() || c == '_'),
            ErrorCode::InvalidUsername
        );

        let mut username_bytes = [0u8; 32];
        let username_slice = username.as_bytes();
        username_bytes[..username_slice.len()].copy_from_slice(username_slice);
        user_profile.username = Some(username_bytes);

        emit!(UsernameUpdated {
            user: ctx.accounts.user.key(),
            username,
        });
    }

    Ok(())
}

#[event]
pub struct UsernameUpdated {
    pub user: Pubkey,
    pub username: String,
}
