import { PublicKey } from '@solana/web3.js'

export enum ProposalStatus {
  Active = 'Active',
  Passed = 'Passed',
  Rejected = 'Rejected',
  Executed = 'Executed',
  Cancelled = 'Cancelled',
}

export interface Proposal {
  publicKey: PublicKey
  proposalId: bigint
  proposer: PublicKey
  marketName: string
  marketDescription: string
  pythPriceFeed: PublicKey

  // Futarchy state
  passPool: bigint
  failPool: bigint
  passPrice: number // Basis points (0-10000)
  failPrice: number // Basis points (0-10000)

  // Timing
  createdAt: bigint
  votingEnds: bigint

  // Status
  status: ProposalStatus
  executed: boolean
  cancelled: boolean

  // Stats
  totalVolume: bigint
  uniqueTraders: number

  // Result (if resolved)
  passed?: boolean
  arenaMarketId?: number
}

export interface ProposalVote {
  publicKey: PublicKey
  proposal: PublicKey
  voter: PublicKey
  passAmount: bigint
  failAmount: bigint
  claimedTokens: boolean
  bump: number
}

export interface CouncilConfig {
  publicKey: PublicKey
  authority: PublicKey
  fateArenaProgram: PublicKey
  proposalStake: bigint
  votingPeriod: bigint
  totalProposals: bigint
  proposerBonusBps: number
  bump: number
}

export interface ProposalFilters {
  status?: ProposalStatus
  sortBy?: 'volume' | 'timeRemaining' | 'passProbability'
  search?: string
}

export interface TradeEstimate {
  amountIn: number
  sharesOut: number
  pricePerShare: number
  newPrice: number
  priceImpact: number
}
