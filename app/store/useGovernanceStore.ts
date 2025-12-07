import { create } from 'zustand'
import { PublicKey } from '@solana/web3.js'

export interface Proposal {
  proposalId: number
  proposer: PublicKey
  proposalType: {
    kind: 'AddMarket' | 'UpdateFees' | 'UpdateLimits' | 'Treasury'
    data: any
  }
  description: string
  state: 'Active' | 'Succeeded' | 'Defeated' | 'Executed' | 'Cancelled'
  votesFor: number
  votesAgainst: number
  totalVotes: number
  startTime: number
  endTime: number
  executedAt?: number
}

interface GovernanceState {
  proposals: Proposal[]
  activeProposal: Proposal | null
  votingPower: number
  setProposals: (proposals: Proposal[]) => void
  addProposal: (proposal: Proposal) => void
  updateProposal: (proposalId: number, updates: Partial<Proposal>) => void
  setActiveProposal: (proposal: Proposal | null) => void
  setVotingPower: (power: number) => void
}

export const useGovernanceStore = create<GovernanceState>((set) => ({
  proposals: [],
  activeProposal: null,
  votingPower: 0,
  setProposals: (proposals) => set({ proposals }),
  addProposal: (proposal) =>
    set((state) => ({ proposals: [...state.proposals, proposal] })),
  updateProposal: (proposalId, updates) =>
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.proposalId === proposalId ? { ...p, ...updates } : p
      ),
    })),
  setActiveProposal: (proposal) => set({ activeProposal: proposal }),
  setVotingPower: (power) => set({ votingPower: power }),
}))
