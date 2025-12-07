use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;
use crate::{GameConfig, Market, ErrorCode, seeds};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateMarketParams {
    pub name: String,
    pub description: String,
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(
        mut,
        seeds = [seeds::GAME_CONFIG],
        bump = config.bump,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, GameConfig>,

    #[account(
        init,
        payer = authority,
        space = Market::LEN,
        seeds = [seeds::MARKET, config.total_matches.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    /// Pyth price feed account - we validate it's a valid Pyth account
    /// CHECK: Validated in handler
    pub pyth_price_feed: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateMarket>, params: CreateMarketParams) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let market = &mut ctx.accounts.market;

    // Validate name and description lengths
    require!(
        params.name.len() <= 32,
        ErrorCode::InvalidMarketName
    );
    require!(
        params.description.len() <= 128,
        ErrorCode::InvalidMarketDescription
    );

    // Validate Pyth account by attempting to deserialize
    let price_update = PriceUpdateV2::try_deserialize(
        &mut ctx.accounts.pyth_price_feed.data.borrow().as_ref()
    );
    require!(
        price_update.is_ok(),
        ErrorCode::InvalidPythAccount
    );

    let market_id = config.total_matches;

    // Initialize market
    market.market_id = market_id;

    // Convert string to fixed-size array
    let mut name_bytes = [0u8; 32];
    let name_slice = params.name.as_bytes();
    name_bytes[..name_slice.len()].copy_from_slice(name_slice);
    market.name = name_bytes;

    let mut desc_bytes = [0u8; 128];
    let desc_slice = params.description.as_bytes();
    desc_bytes[..desc_slice.len()].copy_from_slice(desc_slice);
    market.description = desc_bytes;

    market.pyth_price_feed = ctx.accounts.pyth_price_feed.key();
    market.active = true;
    market.total_matches = 0;
    market.created_at = Clock::get()?.unix_timestamp;
    market.bump = ctx.bumps.market;

    // Update config
    config.total_matches = config.total_matches.checked_add(1)
        .ok_or(ErrorCode::ArithmeticOverflow)?;

    emit!(MarketCreated {
        market_id,
        name: params.name,
        pyth_price_feed: market.pyth_price_feed,
    });

    Ok(())
}

#[event]
pub struct MarketCreated {
    pub market_id: u64,
    pub name: String,
    pub pyth_price_feed: Pubkey,
}
