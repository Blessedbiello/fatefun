use anchor_lang::prelude::*;
use super::PredictionOutcome;

#[account]
pub struct Prediction {
    /// Match this prediction belongs to
    pub match_account: Pubkey,

    /// Player who made the prediction
    pub player: Pubkey,

    /// Predicted outcome
    pub outcome: PredictionOutcome,

    /// Amount wagered
    pub wager: u64,

    /// Whether this prediction won
    pub is_winner: bool,

    /// Payout amount if won
    pub payout: u64,

    /// Whether payout has been claimed
    pub claimed: bool,

    /// Timestamp of prediction
    pub predicted_at: i64,

    /// Bump seed
    pub bump: u8,
}

impl Prediction {
    pub const LEN: usize = 8 + // discriminator
        32 + // match_account
        32 + // player
        1 + // outcome
        8 + // wager
        1 + // is_winner
        8 + // payout
        1 + // claimed
        8 + // predicted_at
        1; // bump
}
