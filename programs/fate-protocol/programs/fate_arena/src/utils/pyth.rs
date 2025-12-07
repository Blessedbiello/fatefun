use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
use crate::ErrorCode;

/// Maximum age for price data (30 seconds)
pub const MAX_PRICE_AGE_SECONDS: u64 = 30;

/// Maximum confidence interval as percentage of price (1%)
pub const MAX_CONFIDENCE_INTERVAL_PCT: u64 = 100; // 1% = 100 basis points

/// Pyth program IDs
pub const PYTH_MAINNET_PROGRAM_ID: &str = "rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ";
pub const PYTH_DEVNET_PROGRAM_ID: &str = "rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ";

/// Pyth price feed IDs for supported markets
pub mod feed_ids {
    // SOL/USD
    pub const SOL_USD_MAINNET: &str = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
    pub const SOL_USD_DEVNET: &str = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

    // BTC/USD
    pub const BTC_USD_MAINNET: &str = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
    pub const BTC_USD_DEVNET: &str = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

    // ETH/USD
    pub const ETH_USD_MAINNET: &str = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
    pub const ETH_USD_DEVNET: &str = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
}

/// Represents a validated Pyth price with metadata
#[derive(Debug, Clone, Copy)]
pub struct PythPrice {
    /// Price value (scaled by exponent)
    pub price: i64,

    /// Confidence interval
    pub confidence: u64,

    /// Price exponent (power of 10)
    pub exponent: i32,

    /// Timestamp when price was published
    pub publish_time: i64,

    /// Normalized price as u64 (for comparison)
    pub normalized_price: u64,
}

impl PythPrice {
    /// Calculate confidence as percentage of price (in basis points)
    pub fn confidence_percentage_bps(&self) -> u64 {
        if self.price == 0 {
            return u64::MAX; // Infinite confidence interval for zero price
        }

        let price_abs = self.price.abs() as u64;
        (self.confidence * 10000) / price_abs
    }

    /// Check if confidence interval is acceptable
    pub fn is_confidence_acceptable(&self) -> bool {
        self.confidence_percentage_bps() <= MAX_CONFIDENCE_INTERVAL_PCT
    }

    /// Normalize price to u64 for storage and comparison
    /// Handles positive and negative exponents
    pub fn normalize_to_u64(&self) -> Result<u64> {
        if self.price <= 0 {
            return Err(ErrorCode::PriceUnavailable.into());
        }

        // Price = price * 10^exponent
        // We want to normalize to a consistent scale (e.g., 6 decimals)
        const TARGET_DECIMALS: i32 = 6;

        let scale_adjustment = TARGET_DECIMALS - self.exponent;

        let normalized = if scale_adjustment >= 0 {
            // Multiply by 10^scale_adjustment
            self.price
                .checked_mul(10i64.pow(scale_adjustment as u32))
                .ok_or(ErrorCode::ArithmeticOverflow)?
        } else {
            // Divide by 10^(-scale_adjustment)
            self.price
                .checked_div(10i64.pow((-scale_adjustment) as u32))
                .ok_or(ErrorCode::ArithmeticOverflow)?
        };

        if normalized < 0 {
            return Err(ErrorCode::PriceUnavailable.into());
        }

        Ok(normalized as u64)
    }
}

/// Parse and validate Pyth price from PriceUpdateV2 account
pub fn get_pyth_price(
    price_update: &PriceUpdateV2,
    feed_id_hex: &str,
    clock: &Clock,
) -> Result<PythPrice> {
    // Get feed ID from hex string
    let feed_id = get_feed_id_from_hex(feed_id_hex)
        .map_err(|_| ErrorCode::InvalidPythAccount)?;

    // Get price with staleness check
    let price_data = price_update
        .get_price_no_older_than(clock, MAX_PRICE_AGE_SECONDS, &feed_id)
        .map_err(|_| ErrorCode::StalePrice)?;

    // Validate price is available
    require!(price_data.price > 0, ErrorCode::PriceUnavailable);

    // Create PythPrice struct
    let pyth_price = PythPrice {
        price: price_data.price,
        confidence: price_data.conf,
        exponent: price_data.exponent,
        publish_time: price_data.publish_time,
        normalized_price: 0, // Will be set below
    };

    // Validate confidence interval
    require!(
        pyth_price.is_confidence_acceptable(),
        ErrorCode::ConfidenceIntervalTooWide
    );

    // Normalize price for storage
    let normalized_price = pyth_price.normalize_to_u64()?;

    Ok(PythPrice {
        normalized_price,
        ..pyth_price
    })
}

/// Validate Pyth price feed account matches expected feed
pub fn validate_price_feed(
    price_feed_account: &AccountInfo,
    expected_feed_id: &str,
) -> Result<()> {
    // Deserialize the price update account
    let price_update = PriceUpdateV2::try_deserialize(
        &mut price_feed_account.data.borrow().as_ref()
    ).map_err(|_| ErrorCode::InvalidPythAccount)?;

    // Verify the account contains the expected feed
    let feed_id = get_feed_id_from_hex(expected_feed_id)
        .map_err(|_| ErrorCode::InvalidPythAccount)?;

    // Try to get price to verify feed exists
    let clock = Clock::get()?;
    price_update
        .get_price_no_older_than(&clock, MAX_PRICE_AGE_SECONDS, &feed_id)
        .map_err(|_| ErrorCode::PriceFeedMismatch)?;

    Ok(())
}

/// Get price for comparison (returns normalized u64)
pub fn get_price_for_comparison(
    price_update: &PriceUpdateV2,
    feed_id_hex: &str,
    clock: &Clock,
) -> Result<u64> {
    let pyth_price = get_pyth_price(price_update, feed_id_hex, clock)?;
    Ok(pyth_price.normalized_price)
}

/// Validate Pyth program ID
pub fn validate_pyth_program(program_id: &Pubkey) -> Result<()> {
    // Check if it's mainnet or devnet Pyth program
    let mainnet_id = Pubkey::try_from(PYTH_MAINNET_PROGRAM_ID)
        .map_err(|_| ErrorCode::InvalidPythAccount)?;
    let devnet_id = Pubkey::try_from(PYTH_DEVNET_PROGRAM_ID)
        .map_err(|_| ErrorCode::InvalidPythAccount)?;

    require!(
        *program_id == mainnet_id || *program_id == devnet_id,
        ErrorCode::InvalidPythAccount
    );

    Ok(())
}

/// Helper to get feed ID hex string from market name
pub fn get_feed_id_for_market(market_name: &str, is_mainnet: bool) -> Option<&'static str> {
    match market_name {
        "SOL/USD" => {
            if is_mainnet {
                Some(feed_ids::SOL_USD_MAINNET)
            } else {
                Some(feed_ids::SOL_USD_DEVNET)
            }
        },
        "BTC/USD" => {
            if is_mainnet {
                Some(feed_ids::BTC_USD_MAINNET)
            } else {
                Some(feed_ids::BTC_USD_DEVNET)
            }
        },
        "ETH/USD" => {
            if is_mainnet {
                Some(feed_ids::ETH_USD_MAINNET)
            } else {
                Some(feed_ids::ETH_USD_DEVNET)
            }
        },
        _ => None,
    }
}

/// Compare two prices and determine winner
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PriceComparison {
    Higher,
    Lower,
    Equal,
}

pub fn compare_prices(start_price: u64, end_price: u64) -> PriceComparison {
    if end_price > start_price {
        PriceComparison::Higher
    } else if end_price < start_price {
        PriceComparison::Lower
    } else {
        PriceComparison::Equal
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_confidence_percentage() {
        let price = PythPrice {
            price: 100_000_000, // $100 with -6 exponent
            confidence: 100_000, // $0.10
            exponent: -6,
            publish_time: 0,
            normalized_price: 0,
        };

        // Confidence is 0.1% of price = 10 bps
        assert_eq!(price.confidence_percentage_bps(), 10);
        assert!(price.is_confidence_acceptable());
    }

    #[test]
    fn test_confidence_too_wide() {
        let price = PythPrice {
            price: 100_000_000,
            confidence: 2_000_000, // $2.00 = 2%
            exponent: -6,
            publish_time: 0,
            normalized_price: 0,
        };

        // Confidence is 2% = 200 bps (exceeds 100 bps limit)
        assert_eq!(price.confidence_percentage_bps(), 200);
        assert!(!price.is_confidence_acceptable());
    }

    #[test]
    fn test_normalize_positive_exponent() {
        let price = PythPrice {
            price: 100,
            confidence: 1,
            exponent: 2, // price = 100 * 10^2 = 10,000
            publish_time: 0,
            normalized_price: 0,
        };

        // Normalize to 6 decimals: 10,000 * 10^6 = 10,000,000,000
        let normalized = price.normalize_to_u64().unwrap();
        assert_eq!(normalized, 10_000_000_000);
    }

    #[test]
    fn test_normalize_negative_exponent() {
        let price = PythPrice {
            price: 100_000_000, // $100
            confidence: 100_000,
            exponent: -6,
            publish_time: 0,
            normalized_price: 0,
        };

        // Already at 6 decimals, no change
        let normalized = price.normalize_to_u64().unwrap();
        assert_eq!(normalized, 100_000_000);
    }

    #[test]
    fn test_price_comparison() {
        assert_eq!(compare_prices(100, 200), PriceComparison::Higher);
        assert_eq!(compare_prices(200, 100), PriceComparison::Lower);
        assert_eq!(compare_prices(100, 100), PriceComparison::Equal);
    }
}
