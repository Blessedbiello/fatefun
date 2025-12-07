use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::constants::seeds;
use crate::errors::*;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateProposalParams {
    pub market_name: String,
    pub market_description: String,
    pub pyth_price_feed: Pubkey,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [seeds::COUNCIL_CONFIG],
        bump = config.bump
    )]
    pub config: Account<'info, CouncilConfig>,

    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [seeds::PROPOSAL, config.total_proposals.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    /// CHECK: Vault PDA to hold staked SOL
    #[account(
        mut,
        seeds = [seeds::PROPOSAL_VAULT, proposal.key().as_ref()],
        bump
    )]
    pub proposal_vault: AccountInfo<'info>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateProposal>, params: CreateProposalParams) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    // Validate market name and description lengths
    require!(
        params.market_name.len() > 0 && params.market_name.len() <= Proposal::MAX_NAME_LEN,
        ErrorCode::InvalidMarketName
    );
    require!(
        params.market_description.len() > 0 && params.market_description.len() <= Proposal::MAX_DESCRIPTION_LEN,
        ErrorCode::InvalidMarketDescription
    );

    // Transfer proposal stake to vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.proposer.to_account_info(),
                to: ctx.accounts.proposal_vault.to_account_info(),
            },
        ),
        config.proposal_stake,
    )?;

    // Initialize proposal
    let proposal_id = config.total_proposals;

    // Convert strings to fixed-size arrays
    let mut name_bytes = [0u8; 64];
    let name_slice = params.market_name.as_bytes();
    name_bytes[..name_slice.len()].copy_from_slice(name_slice);

    let mut desc_bytes = [0u8; 200];
    let desc_slice = params.market_description.as_bytes();
    desc_bytes[..desc_slice.len()].copy_from_slice(desc_slice);

    proposal.proposal_id = proposal_id;
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.market_name = name_bytes;
    proposal.market_description = desc_bytes;
    proposal.pyth_price_feed = params.pyth_price_feed;
    proposal.status = ProposalStatus::Active;
    proposal.pass_pool = 0;
    proposal.fail_pool = 0;
    proposal.pass_price = 5000; // 50% initial
    proposal.fail_price = 5000; // 50% initial
    proposal.created_at = clock.unix_timestamp;
    proposal.voting_ends_at = clock.unix_timestamp + config.voting_period;
    proposal.executed_at = None;
    proposal.bump = ctx.bumps.proposal;

    // Increment counter
    config.total_proposals = config.total_proposals.checked_add(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    emit!(ProposalCreated {
        proposal_id,
        proposer: ctx.accounts.proposer.key(),
        market_name: params.market_name,
        pyth_price_feed: params.pyth_price_feed,
        voting_ends_at: proposal.voting_ends_at,
    });

    msg!("Proposal {} created: {}", proposal_id, params.market_name);
    msg!("Voting ends at: {}", proposal.voting_ends_at);

    Ok(())
}

#[event]
pub struct ProposalCreated {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub market_name: String,
    pub pyth_price_feed: Pubkey,
    pub voting_ends_at: i64,
}
