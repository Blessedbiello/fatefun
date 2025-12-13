/**
 * React hooks for FATE Arena match transactions
 */

import { useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useFateArenaProgram } from './useProgram'
import {
  createMatch,
  joinMatch,
  submitPrediction,
  resolveMatch,
  claimWinnings,
} from '@/lib/transactions/matchTransactions'
import { useWallet } from '@solana/wallet-adapter-react'

export function useMatchTransactions() {
  const program = useFateArenaProgram()
  const { publicKey } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateMatch = async (params: {
    marketAddress: PublicKey
    matchType: 'flashDuel' | 'battleRoyale' | 'tournament'
    entryFee: number
    maxPlayers: number
    predictionWindow: number
    matchDuration: number
  }) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      // User profile is created automatically by the program
      // Map match type to correct format
      const matchTypeObj =
        params.matchType === 'flashDuel' ? { flashDuel: {} } :
        params.matchType === 'battleRoyale' ? { battleRoyale: {} } :
        { tournament: {} }

      const result = await createMatch(program, {
        ...params,
        matchType: matchTypeObj,
      })

      return result
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create match'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinMatch = async (matchAddress: PublicKey) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      // User profile is created automatically by the program
      const result = await joinMatch(program, matchAddress)
      return result
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to join match'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPrediction = async (params: {
    matchAddress: PublicKey
    marketAddress: PublicKey
    pythPriceFeed: PublicKey
    prediction: 'higher' | 'lower'
  }) => {
    if (!program) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await submitPrediction(program, params)
      return result
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to submit prediction'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveMatch = async (params: {
    matchAddress: PublicKey
    marketAddress: PublicKey
    pythPriceFeed: PublicKey
  }) => {
    if (!program) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await resolveMatch(program, params)
      return result
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to resolve match'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimWinnings = async (matchAddress: PublicKey) => {
    if (!program) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await claimWinnings(program, matchAddress)
      return result
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to claim winnings'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return {
    createMatch: handleCreateMatch,
    joinMatch: handleJoinMatch,
    submitPrediction: handleSubmitPrediction,
    resolveMatch: handleResolveMatch,
    claimWinnings: handleClaimWinnings,
    loading,
    error,
  }
}
