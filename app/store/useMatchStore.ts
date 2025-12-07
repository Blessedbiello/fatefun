import { create } from 'zustand'
import { PublicKey } from '@solana/web3.js'

export interface Match {
  matchId: number
  creator: PublicKey
  state: 'Pending' | 'Active' | 'Ended' | 'Resolved' | 'Cancelled'
  marketType: 'PriceDirection' | 'PriceTarget' | 'PriceRange'
  priceFeed: PublicKey
  assetSymbol: string
  entryPrice: number
  exitPrice: number
  targetPrice?: number
  rangeMin?: number
  rangeMax?: number
  entryFee: number
  prizePool: number
  playerCount: number
  maxPlayers: number
  startTime: number
  endTime: number
  duration: number
  winningOutcome?: string
  winnerCount: number
}

interface MatchState {
  matches: Match[]
  activeMatch: Match | null
  setMatches: (matches: Match[]) => void
  addMatch: (match: Match) => void
  updateMatch: (matchId: number, updates: Partial<Match>) => void
  setActiveMatch: (match: Match | null) => void
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  activeMatch: null,
  setMatches: (matches) => set({ matches }),
  addMatch: (match) => set((state) => ({ matches: [...state.matches, match] })),
  updateMatch: (matchId, updates) =>
    set((state) => ({
      matches: state.matches.map((m) => (m.matchId === matchId ? { ...m, ...updates } : m)),
    })),
  setActiveMatch: (match) => set({ activeMatch: match }),
}))
