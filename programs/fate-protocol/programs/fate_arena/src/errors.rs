use anchor_lang::prelude::*;

#[error_code]
pub enum FateArenaError {
    #[msg("Match is not in the correct state for this operation")]
    InvalidMatchState,

    #[msg("Match is full, cannot join")]
    MatchFull,

    #[msg("Match has not started yet")]
    MatchNotStarted,

    #[msg("Match has already started")]
    MatchAlreadyStarted,

    #[msg("Match has not ended yet")]
    MatchNotEnded,

    #[msg("Match has already been resolved")]
    MatchAlreadyResolved,

    #[msg("Not enough players to start match")]
    NotEnoughPlayers,

    #[msg("Invalid bet amount")]
    InvalidBetAmount,

    #[msg("Invalid prediction value")]
    InvalidPrediction,

    #[msg("Player already joined this match")]
    PlayerAlreadyJoined,

    #[msg("Player has not joined this match")]
    PlayerNotInMatch,

    #[msg("No winnings to claim")]
    NoWinnings,

    #[msg("Already claimed winnings")]
    AlreadyClaimed,

    #[msg("Unauthorized action")]
    Unauthorized,

    #[msg("Price feed is stale")]
    StalePriceFeed,

    #[msg("Invalid price feed")]
    InvalidPriceFeed,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Invalid market type")]
    InvalidMarketType,

    #[msg("Resolution window has passed")]
    ResolutionWindowPassed,

    #[msg("Cannot cancel started match")]
    CannotCancelStartedMatch,

    #[msg("Invalid match duration")]
    InvalidMatchDuration,

    #[msg("Invalid fee configuration")]
    InvalidFeeConfiguration,
}
