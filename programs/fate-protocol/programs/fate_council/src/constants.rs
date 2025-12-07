use anchor_lang::prelude::*;

#[constant]
pub const COUNCIL_SEED: &[u8] = b"council";

#[constant]
pub const PROPOSAL_SEED: &[u8] = b"proposal";

#[constant]
pub const VOTE_SEED: &[u8] = b"vote";

// Governance parameters
pub const MIN_VOTE_THRESHOLD: u64 = 100_000_000; // 0.1 SOL in voting power
pub const PROPOSAL_DURATION: i64 = 604800; // 7 days
pub const EXECUTION_DELAY: i64 = 86400; // 1 day
pub const QUORUM_PERCENTAGE: u8 = 10; // 10% of total voting power
pub const APPROVAL_THRESHOLD: u8 = 60; // 60% approval needed
