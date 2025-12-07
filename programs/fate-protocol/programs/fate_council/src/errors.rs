use anchor_lang::prelude::*;

#[error_code]
pub enum FateCouncilError {
    #[msg("Insufficient voting power")]
    InsufficientVotingPower,

    #[msg("Proposal is not active")]
    ProposalNotActive,

    #[msg("Proposal has already been executed")]
    ProposalAlreadyExecuted,

    #[msg("Voting period has ended")]
    VotingPeriodEnded,

    #[msg("Voting period has not ended")]
    VotingPeriodNotEnded,

    #[msg("Already voted on this proposal")]
    AlreadyVoted,

    #[msg("Proposal did not reach quorum")]
    QuorumNotReached,

    #[msg("Proposal was not approved")]
    ProposalNotApproved,

    #[msg("Execution delay not met")]
    ExecutionDelayNotMet,

    #[msg("Unauthorized action")]
    Unauthorized,

    #[msg("Invalid proposal type")]
    InvalidProposalType,

    #[msg("Math overflow")]
    MathOverflow,
}
