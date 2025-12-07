import { create } from 'zustand'
import { PublicKey } from '@solana/web3.js'

export interface PlayerStats {
  wallet: PublicKey
  matchesPlayed: number
  matchesWon: number
  totalWinnings: number
  totalLosses: number
  winStreak: number
  bestWinStreak: number
  level: number
  xp: number
  winRate: number
  netProfit: number
}

interface PlayerState {
  playerStats: PlayerStats | null
  setPlayerStats: (stats: PlayerStats | null) => void
  updateStats: (updates: Partial<PlayerStats>) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  playerStats: null,
  setPlayerStats: (stats) => set({ playerStats: stats }),
  updateStats: (updates) =>
    set((state) => ({
      playerStats: state.playerStats ? { ...state.playerStats, ...updates } : null,
    })),
}))
