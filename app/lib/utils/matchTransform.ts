/**
 * Utility functions to transform raw blockchain data into frontend-friendly formats
 */

import { PublicKey } from '@solana/web3.js'
import { Match, MatchAccount, PlayerEntry, PredictionSide } from '@/types/arena'

/**
 * Format match status from Anchor enum object to readable string
 * Anchor returns enums as objects like { open: {} } or { inProgress: {} }
 */
export function formatMatchStatus(status: any): string {
  if (!status) return 'Unknown'
  if (typeof status === 'string') return status

  const key = Object.keys(status)[0]
  if (!key) return 'Unknown'

  // Convert camelCase to Title Case
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
}

/**
 * Format match type from Anchor enum object to readable string
 */
export function formatMatchType(matchType: any): string {
  if (!matchType) return 'Unknown'
  if (typeof matchType === 'string') return matchType

  const key = Object.keys(matchType)[0]
  if (!key) return 'Unknown'

  // Convert camelCase to Title Case with spaces
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
}

/**
 * Format prediction side from Anchor enum object to readable string
 */
export function formatPredictionSide(prediction: any): string {
  if (!prediction) return 'None'
  if (typeof prediction === 'string') return prediction

  const key = Object.keys(prediction)[0]
  if (!key) return 'None'

  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * Transform raw Match account data from blockchain into enhanced Match object
 */
export function enhanceMatchData(
  matchAccount: MatchAccount,
  publicKey: PublicKey,
  options?: {
    marketName?: string
    marketId?: number
    players?: PlayerEntry[]
    protocolFeeBps?: number
  }
): Match {
  // Calculate prediction deadline
  const predictionDeadline = matchAccount.createdAt + matchAccount.predictionWindow

  // Calculate pool distributions if players are provided
  let higherPool = BigInt(0)
  let lowerPool = BigInt(0)

  if (options?.players) {
    for (const player of options.players) {
      if (player.prediction === PredictionSide.Higher) {
        higherPool += player.amountStaked
      } else if (player.prediction === PredictionSide.Lower) {
        lowerPool += player.amountStaked
      }
    }
  }

  // Calculate protocol fee if feeBps is provided
  let protocolFee: bigint | undefined
  if (options?.protocolFeeBps !== undefined) {
    protocolFee = (matchAccount.totalPot * BigInt(options.protocolFeeBps)) / BigInt(10000)
  }

  return {
    ...matchAccount,
    publicKey,

    // Computed properties
    predictionDeadline,
    marketId: options?.marketId,
    marketName: options?.marketName,

    // Alias properties
    startingPrice: matchAccount.startPrice,
    endingPrice: matchAccount.endPrice,
    prizePool: matchAccount.totalPot,

    // Calculated properties
    higherPool: higherPool > 0 ? higherPool : undefined,
    lowerPool: lowerPool > 0 ? lowerPool : undefined,
    players: options?.players,
    protocolFee,
  }
}

/**
 * Calculate the current time until prediction deadline
 */
export function getTimeUntilDeadline(match: Match): number {
  const now = BigInt(Math.floor(Date.now() / 1000))
  const deadline = match.predictionDeadline
  return Number(deadline - now)
}

/**
 * Calculate time until resolution
 */
export function getTimeUntilResolution(match: Match): number {
  const now = BigInt(Math.floor(Date.now() / 1000))
  return Number(match.resolutionTime - now)
}

/**
 * Check if predictions are still open for a match
 */
export function canSubmitPrediction(match: Match): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000))
  return now < match.predictionDeadline && match.status?.toString() === 'Open'
}

/**
 * Check if match can be resolved
 */
export function canResolveMatch(match: Match): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000))
  return now >= match.resolutionTime && match.status?.toString() === 'InProgress'
}

/**
 * Get winning pool amount
 */
export function getWinningPool(match: Match): bigint {
  if (!match.winningSide) return BigInt(0)

  if (match.winningSide === PredictionSide.Higher) {
    return match.higherPool || BigInt(0)
  } else {
    return match.lowerPool || BigInt(0)
  }
}

/**
 * Get losing pool amount
 */
export function getLosingPool(match: Match): bigint {
  if (!match.winningSide) return BigInt(0)

  if (match.winningSide === PredictionSide.Higher) {
    return match.lowerPool || BigInt(0)
  } else {
    return match.higherPool || BigInt(0)
  }
}

/**
 * Calculate player's potential winnings
 */
export function calculatePotentialWinnings(
  match: Match,
  playerStake: bigint,
  playerPrediction: PredictionSide
): bigint {
  const playerPool = playerPrediction === PredictionSide.Higher
    ? (match.higherPool || BigInt(0))
    : (match.lowerPool || BigInt(0))

  const oppositePool = playerPrediction === PredictionSide.Higher
    ? (match.lowerPool || BigInt(0))
    : (match.higherPool || BigInt(0))

  if (playerPool === BigInt(0)) return BigInt(0)

  // Calculate share of opposite pool
  const playerShare = playerStake / playerPool
  const winnings = (oppositePool * playerShare) + playerStake

  // Subtract protocol fee
  const protocolFee = match.protocolFee || BigInt(0)
  const playerFeeShare = (protocolFee * playerStake) / playerPool

  return winnings - playerFeeShare
}
