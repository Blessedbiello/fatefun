import { useEffect, useRef } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useGameStore } from '@/store/gameStore'
import { useFateArenaProgram } from './useProgram'
import { MatchStatus } from '@/types/arena'

interface MatchSubscriptionOptions {
  matchPubkey: PublicKey | string | null
  enabled?: boolean
  pollingInterval?: number
}

export function useMatchSubscription({
  matchPubkey,
  enabled = true,
  pollingInterval = 2000,
}: MatchSubscriptionOptions) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const program = useFateArenaProgram()

  const setCurrentMatch = useGameStore((s) => s.setCurrentMatch)
  const setPlayerEntry = useGameStore((s) => s.setPlayerEntry)
  const updateOpponents = useGameStore((s) => s.updateOpponents)
  const setMatchWsConnected = useGameStore((s) => s.setMatchWsConnected)
  const currentMatch = useGameStore((s) => s.currentMatch)
  const playSound = useGameStore((s) => s.playSound)
  const soundEnabled = useGameStore((s) => s.soundEnabled)

  const subscriptionIdRef = useRef<number | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousPlayerCountRef = useRef<number>(0)
  const previousStatusRef = useRef<MatchStatus | null>(null)

  useEffect(() => {
    if (!enabled || !matchPubkey || !program) return

    const pubkey = typeof matchPubkey === 'string' ? new PublicKey(matchPubkey) : matchPubkey

    // Parse and update match data
    const updateMatchData = (accountInfo: any) => {
      try {
        const match = program.account.match.coder.accounts.decode('Match', accountInfo.data)

        // Check for player count changes
        if (match.currentPlayers > previousPlayerCountRef.current && soundEnabled) {
          playSound('join')
        }
        previousPlayerCountRef.current = match.currentPlayers

        // Check for status changes
        if (previousStatusRef.current && match.status !== previousStatusRef.current) {
          console.log(`Match status changed: ${previousStatusRef.current} -> ${match.status}`)

          // Play appropriate sound
          if (match.status === MatchStatus.InProgress && soundEnabled) {
            playSound('predict')
          } else if (match.status === MatchStatus.Completed && soundEnabled) {
            // Determine if current user won
            const userEntry = match.players?.find(
              (p: any) => p.player.toString() === publicKey?.toString()
            )

            if (userEntry) {
              const priceChange = Number(match.endingPrice || 0) - Number(match.startingPrice)
              const winningSide = priceChange > 0 ? 'Higher' : 'Lower'
              const userWon = userEntry.prediction === winningSide

              playSound(userWon ? 'win' : 'lose')
            }
          }
        }
        previousStatusRef.current = match.status

        // Update match in store
        setCurrentMatch({ ...match, publicKey: pubkey })

        // Update player entry if user is connected
        if (publicKey) {
          const playerEntry = match.players?.find(
            (p: any) => p.player.toString() === publicKey.toString()
          )
          setPlayerEntry(playerEntry || null)

          // Update opponents list
          const opponents = match.players?.filter(
            (p: any) => p.player.toString() !== publicKey.toString()
          ) || []
          updateOpponents(opponents)
        }
      } catch (error) {
        console.error('Failed to decode match data:', error)
      }
    }

    // Method 1: WebSocket subscription
    const subscribeWebSocket = async () => {
      try {
        subscriptionIdRef.current = connection.onAccountChange(
          pubkey,
          (accountInfo) => {
            updateMatchData(accountInfo)
          },
          'confirmed'
        )

        setMatchWsConnected(true)
        console.log('✅ Match WebSocket subscription active')

        // Initial fetch
        const accountInfo = await connection.getAccountInfo(pubkey)
        if (accountInfo) {
          updateMatchData(accountInfo)
        }

      } catch (error) {
        console.error('Match WebSocket subscription failed:', error)
        setMatchWsConnected(false)

        // Fallback to polling
        startPolling()
      }
    }

    // Method 2: Polling fallback
    const startPolling = () => {
      console.log('📊 Starting match polling fallback...')

      const poll = async () => {
        try {
          const match = await program.account.match.fetch(pubkey)

          // Check for player count changes
          if (match.currentPlayers > previousPlayerCountRef.current && soundEnabled) {
            playSound('join')
          }
          previousPlayerCountRef.current = match.currentPlayers

          // Check for status changes
          if (previousStatusRef.current && match.status !== previousStatusRef.current) {
            console.log(`Match status changed: ${previousStatusRef.current} -> ${match.status}`)

            if (match.status === MatchStatus.InProgress && soundEnabled) {
              playSound('predict')
            } else if (match.status === MatchStatus.Completed && soundEnabled) {
              const userEntry = match.players?.find(
                (p: any) => p.player.toString() === publicKey?.toString()
              )

              if (userEntry) {
                const priceChange = Number(match.endingPrice || 0) - Number(match.startingPrice)
                const winningSide = priceChange > 0 ? 'Higher' : 'Lower'
                const userWon = userEntry.prediction === winningSide

                playSound(userWon ? 'win' : 'lose')
              }
            }
          }
          previousStatusRef.current = match.status

          setCurrentMatch({ ...match, publicKey: pubkey })

          if (publicKey) {
            const playerEntry = match.players?.find(
              (p: any) => p.player.toString() === publicKey.toString()
            )
            setPlayerEntry(playerEntry || null)

            const opponents = match.players?.filter(
              (p: any) => p.player.toString() !== publicKey.toString()
            ) || []
            updateOpponents(opponents)
          }
        } catch (error) {
          console.error('Match polling error:', error)
        }
      }

      // Initial poll
      poll()

      // Set up interval - smart polling based on match status
      const getPollingInterval = () => {
        if (!currentMatch) return pollingInterval

        // Poll faster for active matches
        if (currentMatch.status === MatchStatus.Open || currentMatch.status === MatchStatus.InProgress) {
          return 2000 // 2 seconds
        }

        // Poll slower for completed matches
        return 10000 // 10 seconds
      }

      pollingIntervalRef.current = setInterval(poll, getPollingInterval())
    }

    // Try WebSocket first
    subscribeWebSocket()

    // Cleanup
    return () => {
      if (subscriptionIdRef.current !== null) {
        connection.removeAccountChangeListener(subscriptionIdRef.current)
        console.log('🔌 Match WebSocket unsubscribed')
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        console.log('⏹️ Match polling stopped')
      }

      setMatchWsConnected(false)
    }
  }, [
    enabled,
    matchPubkey,
    connection,
    program,
    publicKey,
    setCurrentMatch,
    setPlayerEntry,
    updateOpponents,
    setMatchWsConnected,
    pollingInterval,
    currentMatch,
    playSound,
    soundEnabled,
  ])
}

// Hook to subscribe to multiple matches (for arena page)
export function useMatchesSubscription({
  enabled = true,
  filters = {},
  limit = 20,
}: {
  enabled?: boolean
  filters?: any
  limit?: number
}) {
  const program = useFateArenaProgram()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled || !program) return

    const pollMatches = async () => {
      try {
        let matches = await program.account.match.all()

        // Apply filters
        if (filters.status) {
          matches = matches.filter((m) => m.account.status === filters.status)
        }
        if (filters.matchType) {
          matches = matches.filter((m) => m.account.matchType === filters.matchType)
        }
        if (limit) {
          matches = matches.slice(0, limit)
        }

        // Store could be updated here if needed
        // For now, this is just for the arena page which uses React Query

      } catch (error) {
        console.error('Failed to poll matches:', error)
      }
    }

    // Initial poll
    pollMatches()

    // Poll every 5 seconds for match list
    pollingIntervalRef.current = setInterval(pollMatches, 5000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [enabled, program, filters, limit])
}
