use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CastVoteParams {
    pub choice: VoteChoice,
    pub voting_power: u64,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        mut,
        seeds = [PROPOSAL_SEED, proposal.proposal_id.to_le_bytes().as_ref()],
        bump = proposal.bump,
        constraint = proposal.state == ProposalState::Active @ FateCouncilError::ProposalNotActive
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init,
        payer = voter,
        space = Vote::LEN,
        seeds = [VOTE_SEED, proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CastVote>, params: CastVoteParams) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let vote = &mut ctx.accounts.vote;
    let clock = Clock::get()?;

    // Check voting period
    require!(
        clock.unix_timestamp <= proposal.end_time,
        FateCouncilError::VotingPeriodEnded
    );

    // Initialize vote
    vote.proposal = proposal.key();
    vote.voter = ctx.accounts.voter.key();
    vote.choice = params.choice;
    vote.voting_power = params.voting_power;
    vote.voted_at = clock.unix_timestamp;
    vote.bump = ctx.bumps.vote;

    // Update proposal vote counts
    match params.choice {
        VoteChoice::For => {
            proposal.votes_for = proposal.votes_for.checked_add(params.voting_power).unwrap();
        },
        VoteChoice::Against => {
            proposal.votes_against = proposal.votes_against.checked_add(params.voting_power).unwrap();
        },
        VoteChoice::Abstain => {},
    }

    proposal.total_votes = proposal.total_votes.checked_add(params.voting_power).unwrap();

    msg!("Vote cast on proposal {}", proposal.proposal_id);

    Ok(())
}
