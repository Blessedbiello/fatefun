use anchor_lang::prelude::*;

#[account]
pub struct Player {
    /// Player's wallet
    pub wallet: Pubkey,

    /// Total matches played
    pub matches_played: u64,

    /// Total matches won
    pub matches_won: u64,

    /// Total winnings (in lamports)
    pub total_winnings: u64,

    /// Total losses (in lamports)
    pub total_losses: u64,

    /// Current win streak
    pub win_streak: u32,

    /// Best win streak
    pub best_win_streak: u32,

    /// Player level
    pub level: u16,

    /// Experience points
    pub xp: u64,

    /// Account creation timestamp
    pub created_at: i64,

    /// Last match timestamp
    pub last_match_at: i64,

    /// Bump seed
    pub bump: u8,
}

impl Player {
    pub const LEN: usize = 8 + // discriminator
        32 + // wallet
        8 + // matches_played
        8 + // matches_won
        8 + // total_winnings
        8 + // total_losses
        4 + // win_streak
        4 + // best_win_streak
        2 + // level
        8 + // xp
        8 + // created_at
        8 + // last_match_at
        1; // bump

    pub fn win_rate(&self) -> f64 {
        if self.matches_played == 0 {
            return 0.0;
        }
        (self.matches_won as f64 / self.matches_played as f64) * 100.0
    }

    pub fn net_profit(&self) -> i64 {
        self.total_winnings as i64 - self.total_losses as i64
    }
}
