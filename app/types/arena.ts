import { PublicKey } from '@solana/web3.js'

export enum MatchType {
  FlashDuel = 'FlashDuel',
  BattleRoyale = 'BattleRoyale',
  Tournament = 'Tournament',
}

export enum MatchStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum PredictionSide {
  Higher = 'Higher',
  Lower = 'Lower',
}

// Raw Match data from blockchain (matches IDL exactly)
export interface MatchAccount {
  matchId: bigint
  market: PublicKey // Note: This is a PublicKey, not a number
  creator: PublicKey
  matchType: MatchType
  entryFee: bigint
  maxPlayers: number
  currentPlayers: number
  status: MatchStatus
  startPrice: bigint | null
  endPrice: bigint | null
  predictionWindow: bigint
  resolutionTime: bigint
  winningSide: PredictionSide | null
  totalPot: bigint
  createdAt: bigint
  startedAt: bigint | null
  resolvedAt: bigint | null
  bump: number
}

// Enhanced Match interface for frontend use (with computed properties)
export interface Match extends MatchAccount {
  publicKey: PublicKey

  // Computed/helper properties for frontend convenience
  marketId?: number // Extracted from market data if available
  marketName?: string // Fetched from Market account
  predictionDeadline: bigint // Calculated: createdAt + predictionWindow

  // Alias properties for backwards compatibility
  startingPrice: bigint | null // Alias for startPrice
  endingPrice: bigint | null // Alias for endPrice
  prizePool: bigint // Alias for totalPot

  // Pool distribution (calculated from player entries)
  higherPool?: bigint
  lowerPool?: bigint

  // Player list (fetched separately)
  players?: PlayerEntry[]

  // Protocol fee (calculated based on config)
  protocolFee?: bigint
}

export interface Market {
  publicKey: PublicKey
  marketId: number
  assetSymbol: string
  pythPriceFeed: PublicKey
  icon?: string
  isActive: boolean
}

export interface PlayerEntry {
  publicKey: PublicKey
  match: PublicKey
  player: PublicKey
  amountStaked: bigint
  prediction: PredictionSide | null
  predictionLockedAt: bigint | null
  claimed: boolean
  winnings: bigint
  bump: number
}

export interface UserProfile {
  publicKey: PublicKey
  user: PublicKey
  totalMatches: bigint
  wins: bigint
  losses: bigint
  totalWagered: bigint
  totalWon: bigint
  xp: bigint
  level: number
  currentStreak: number
  bestStreak: number
  username: string | null
  bump: number
}

export interface MatchFilters {
  status?: MatchStatus
  matchType?: MatchType
  marketId?: number
  minEntryFee?: bigint
  maxEntryFee?: bigint
}

export type SortOption = 'newest' | 'entry_fee' | 'players'
