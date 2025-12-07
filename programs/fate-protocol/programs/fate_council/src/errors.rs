use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Proposal is not active")]
    ProposalNotActive,

    #[msg("Voting period has not ended yet")]
    VotingPeriodNotEnded,

    #[msg("Voting period has already ended")]
    VotingPeriodEnded,

    #[msg("Proposal has already been executed")]
    ProposalAlreadyExecuted,

    #[msg("Proposal did not pass")]
    ProposalDidNotPass,

    #[msg("Proposal has not been resolved yet")]
    ProposalNotResolved,

    #[msg("Trade amount below minimum")]
    TradeAmountTooSmall,

    #[msg("Trade amount above maximum")]
    TradeAmountTooLarge,

    #[msg("Winnings already claimed")]
    AlreadyClaimed,

    #[msg("No winnings to claim")]
    NoWinnings,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Invalid market name length")]
    InvalidMarketName,

    #[msg("Invalid market description length")]
    InvalidMarketDescription,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Insufficient liquidity in pool")]
    InsufficientLiquidity,

    #[msg("Cannot cancel proposal after voting has started")]
    CannotCancelAfterVotingStarted,
}
