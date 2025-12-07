import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { getFateArenaProgram, getFateCouncilProgram } from '@/lib/anchor/setup'

export function useFateArenaProgram() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  return useMemo(() => {
    if (!wallet) return null
    return getFateArenaProgram(connection, wallet)
  }, [connection, wallet])
}

export function useFateCouncilProgram() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  return useMemo(() => {
    if (!wallet) return null
    return getFateCouncilProgram(connection, wallet)
  }, [connection, wallet])
}
