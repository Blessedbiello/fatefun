use anchor_lang::prelude::*;
use crate::errors::FateArenaError;

pub fn validate_fee_bps(fee_bps: u16, max_bps: u16) -> Result<()> {
    require!(fee_bps <= max_bps, FateArenaError::InvalidFeeConfiguration);
    Ok(())
}

pub fn validate_price_range(min: i64, max: i64) -> Result<()> {
    require!(max > min, FateArenaError::InvalidPrediction);
    Ok(())
}

pub fn is_price_stale(current_time: i64, publish_time: i64, threshold: u64) -> bool {
    (current_time - publish_time) > threshold as i64
}
