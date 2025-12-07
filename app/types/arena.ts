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

export interface Match {
  publicKey: PublicKey
  matchId: bigint
  marketId: number
  matchType: MatchType
  status: MatchStatus
  creator: PublicKey
  entryFee: bigint
  maxPlayers: number
  currentPlayers: number
  predictionWindow: bigint
  resolutionTime: bigint
  startPrice: bigint | null
  endPrice: bigint | null
  winningSide: PredictionSide | null
  prizePool: bigint
  protocolFee: bigint
  createdAt: bigint
  startedAt: bigint | null
  resolvedAt: bigint | null
  bump: number
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
