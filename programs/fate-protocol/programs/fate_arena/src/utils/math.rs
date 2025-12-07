use anchor_lang::prelude::*;
use crate::errors::FateArenaError;

pub fn calculate_fee(amount: u64, fee_bps: u16, basis_points: u16) -> Result<u64> {
    amount
        .checked_mul(fee_bps as u64)
        .and_then(|v| v.checked_div(basis_points as u64))
        .ok_or(FateArenaError::MathOverflow.into())
}

pub fn calculate_payout(
    total_pool: u64,
    winner_count: u64,
    platform_fee_bps: u16,
    treasury_fee_bps: u16,
    basis_points: u16,
) -> Result<u64> {
    let platform_fee = calculate_fee(total_pool, platform_fee_bps, basis_points)?;
    let treasury_fee = calculate_fee(total_pool, treasury_fee_bps, basis_points)?;

    let payout_pool = total_pool
        .checked_sub(platform_fee)
        .and_then(|v| v.checked_sub(treasury_fee))
        .ok_or(FateArenaError::MathOverflow)?;

    payout_pool
        .checked_div(winner_count)
        .ok_or(FateArenaError::MathOverflow.into())
}

pub fn scale_price(price: i64, expo: i32, target_decimals: u8) -> Result<i64> {
    let scale_factor = 10i64.pow(target_decimals as u32);
    let price_scale = 10i64.pow(expo.abs() as u32);

    if expo < 0 {
        price
            .checked_mul(scale_factor)
            .and_then(|v| v.checked_div(price_scale))
            .ok_or(FateArenaError::MathOverflow.into())
    } else {
        price
            .checked_mul(scale_factor)
            .and_then(|v| v.checked_mul(price_scale))
            .ok_or(FateArenaError::MathOverflow.into())
    }
}
