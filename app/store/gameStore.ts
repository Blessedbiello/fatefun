import { create } from 'zustand'
import { PublicKey } from '@solana/web3.js'
import { Match, PlayerEntry, PredictionSide, MatchStatus } from '@/types/arena'
import { useAppStore } from './useAppStore'

export interface PricePoint {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface GameStore {
  // Connection state
  connected: boolean
  publicKey: PublicKey | null
  setConnected: (connected: boolean) => void
  setPublicKey: (publicKey: PublicKey | null) => void

  // Current match state
  currentMatch: Match | null
  playerEntry: PlayerEntry | null
  opponents: PlayerEntry[]
  setCurrentMatch: (match: Match | null) => void
  setPlayerEntry: (entry: PlayerEntry | null) => void
  updateOpponents: (opponents: PlayerEntry[]) => void

  // Real-time data
  currentPrice: number
  priceHistory: PricePoint[]
  countdown: number
  updateCurrentPrice: (price: number) => void
  addPricePoint: (point: PricePoint) => void
  setPriceHistory: (history: PricePoint[]) => void
  setCountdown: (seconds: number) => void

  // Transaction state
  isPredicting: boolean
  isClaiming: false
  txSignature: string | null
  txStatus: 'idle' | 'pending' | 'confirmed' | 'failed'
  setTxStatus: (status: 'idle' | 'pending' | 'confirmed' | 'failed', signature?: string) => void

  // Optimistic updates
  optimisticPrediction: PredictionSide | null
  setOptimisticPrediction: (side: PredictionSide | null) => void

  // WebSocket state
  wsConnected: boolean
  priceWsConnected: boolean
  matchWsConnected: boolean
  setWsConnected: (connected: boolean) => void
  setPriceWsConnected: (connected: boolean) => void
  setMatchWsConnected: (connected: boolean) => void

  // Actions
  submitPrediction: (side: PredictionSide, program: any, wallet: any) => Promise<void>
  claimWinnings: (program: any, wallet: any) => Promise<void>
  refreshMatch: (program: any) => Promise<void>

  // Sound effects
  soundEnabled: boolean
  toggleSound: () => void
  playSound: (sound: 'countdown' | 'predict' | 'win' | 'lose' | 'join') => void

  // Reset
  reset: () => void
}

// Audio instances (lazy loaded)
let audioCache: Record<string, HTMLAudioElement> = {}

const loadAudio = (name: string): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null

  if (!audioCache[name]) {
    try {
      audioCache[name] = new Audio(`/sounds/${name}.mp3`)
      audioCache[name].volume = 0.5
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`)
      return null
    }
  }
  return audioCache[name]
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Connection state
  connected: false,
  publicKey: null,
  setConnected: (connected) => set({ connected }),
  setPublicKey: (publicKey) => set({ publicKey }),

  // Current match state
  currentMatch: null,
  playerEntry: null,
  opponents: [],
  setCurrentMatch: (currentMatch) => set({ currentMatch }),
  setPlayerEntry: (playerEntry) => set({ playerEntry }),
  updateOpponents: (opponents) => set({ opponents }),

  // Real-time data
  currentPrice: 0,
  priceHistory: [],
  countdown: 0,
  updateCurrentPrice: (currentPrice) => {
    set({ currentPrice })

    // Add to price history if we have a timestamp
    const state = get()
    const now = Date.now() / 1000

    // Create new candle or update existing
    if (state.priceHistory.length === 0) {
      set({
        priceHistory: [{
          time: now,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
        }]
      })
    } else {
      const lastCandle = state.priceHistory[state.priceHistory.length - 1]
      const timeDiff = now - lastCandle.time

      // Create new candle every 5 seconds
      if (timeDiff >= 5) {
        set({
          priceHistory: [...state.priceHistory, {
            time: now,
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice,
          }]
        })
      } else {
        // Update current candle
        const updatedHistory = [...state.priceHistory]
        updatedHistory[updatedHistory.length - 1] = {
          ...lastCandle,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
          close: currentPrice,
        }
        set({ priceHistory: updatedHistory })
      }
    }
  },
  addPricePoint: (point) => set((state) => ({
    priceHistory: [...state.priceHistory, point]
  })),
  setPriceHistory: (priceHistory) => set({ priceHistory }),
  setCountdown: (countdown) => {
    const state = get()

    // Play countdown sound at 10, 5, 3, 2, 1 seconds
    if (state.soundEnabled && [10, 5, 3, 2, 1].includes(countdown)) {
      state.playSound('countdown')
    }

    set({ countdown })
  },

  // Transaction state
  isPredicting: false,
  isClaiming: false,
  txSignature: null,
  txStatus: 'idle',
  setTxStatus: (txStatus, txSignature) => set({ txStatus, txSignature }),

  // Optimistic updates
  optimisticPrediction: null,
  setOptimisticPrediction: (optimisticPrediction) => set({ optimisticPrediction }),

  // WebSocket state
  wsConnected: false,
  priceWsConnected: false,
  matchWsConnected: false,
  setWsConnected: (wsConnected) => set({ wsConnected }),
  setPriceWsConnected: (priceWsConnected) => set({ priceWsConnected }),
  setMatchWsConnected: (matchWsConnected) => set({ matchWsConnected }),

  // Actions
  submitPrediction: async (side, program, wallet) => {
    const state = get()
    if (!state.currentMatch || !wallet.publicKey) {
      throw new Error('No match or wallet connected')
    }

    set({ isPredicting: true, txStatus: 'pending', optimisticPrediction: side })

    try {
      // Build transaction with priority fee
      const tx = await program.methods
        .submitPrediction({
          prediction: side === PredictionSide.Higher ? { higher: {} } : { lower: {} },
        })
        .accounts({
          match: state.currentMatch.publicKey,
          player: wallet.publicKey,
          // ... other accounts
        })
        .transaction()

      // Add priority fee (10,000 microlamports = 0.00001 SOL)
      const priorityFee = 10_000
      tx.add({
        programId: new PublicKey('ComputeBudget111111111111111111111111111111'),
        keys: [],
        data: Buffer.from([3, ...new Uint8Array(new BigUint64Array([BigInt(priorityFee)]).buffer)]),
      })

      // Send transaction
      const signature = await wallet.sendTransaction(tx, program.provider.connection)
      set({ txSignature: signature })

      // Confirm transaction with retries
      let confirmed = false
      let attempts = 0
      const maxAttempts = 30

      while (!confirmed && attempts < maxAttempts) {
        try {
          const status = await program.provider.connection.getSignatureStatus(signature)

          if (status?.value?.confirmationStatus === 'confirmed' ||
              status?.value?.confirmationStatus === 'finalized') {
            confirmed = true
            set({ txStatus: 'confirmed', isPredicting: false })

            // Play success sound
            if (state.soundEnabled) {
              state.playSound('predict')
            }

            // Show success notification
            useAppStore.getState().addNotification({
              type: 'success',
              title: 'Prediction Submitted!',
              message: `You predicted ${side.toUpperCase()}`,
            })

            // Refresh match data
            await state.refreshMatch(program)
            break
          }

          if (status?.value?.err) {
            throw new Error('Transaction failed')
          }
        } catch (error) {
          console.error('Confirmation check error:', error)
        }

        attempts++
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      if (!confirmed) {
        throw new Error('Transaction confirmation timeout')
      }

    } catch (error) {
      console.error('Prediction error:', error)

      set({
        txStatus: 'failed',
        isPredicting: false,
        optimisticPrediction: null, // Revert optimistic update
      })

      useAppStore.getState().addNotification({
        type: 'error',
        title: 'Prediction Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      })

      throw error
    }
  },

  claimWinnings: async (program, wallet) => {
    const state = get()
    if (!state.currentMatch || !wallet.publicKey) {
      throw new Error('No match or wallet connected')
    }

    set({ isClaiming: true, txStatus: 'pending' })

    try {
      const signature = await program.methods
        .claimWinnings()
        .accounts({
          match: state.currentMatch.publicKey,
          player: wallet.publicKey,
          // ... other accounts
        })
        .rpc()

      set({ txSignature: signature, txStatus: 'confirmed', isClaiming: false })

      // Play win sound
      if (state.soundEnabled) {
        state.playSound('win')
      }

      useAppStore.getState().addNotification({
        type: 'success',
        title: 'Winnings Claimed!',
        message: `Successfully claimed your winnings`,
      })

      await state.refreshMatch(program)

    } catch (error) {
      console.error('Claim error:', error)

      set({ txStatus: 'failed', isClaiming: false })

      useAppStore.getState().addNotification({
        type: 'error',
        title: 'Claim Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      })

      throw error
    }
  },

  refreshMatch: async (program) => {
    const state = get()
    if (!state.currentMatch) return

    try {
      const match = await program.account.match.fetch(state.currentMatch.publicKey)

      // Check if new players joined
      const oldPlayerCount = state.currentMatch.currentPlayers
      const newPlayerCount = match.currentPlayers

      if (newPlayerCount > oldPlayerCount && state.soundEnabled) {
        state.playSound('join')
      }

      set({ currentMatch: { ...match, publicKey: state.currentMatch.publicKey } })

      // Update player entry if exists
      if (state.publicKey) {
        const playerEntry = match.players?.find(
          (p: any) => p.player.toString() === state.publicKey?.toString()
        )
        if (playerEntry) {
          set({ playerEntry })
        }
      }

      // Update opponents
      const opponents = match.players?.filter(
        (p: any) => p.player.toString() !== state.publicKey?.toString()
      ) || []
      set({ opponents })

    } catch (error) {
      console.error('Failed to refresh match:', error)
    }
  },

  // Sound effects
  soundEnabled: true,
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  playSound: (sound) => {
    const state = get()
    if (!state.soundEnabled) return

    const audio = loadAudio(sound)
    if (audio) {
      audio.currentTime = 0
      audio.play().catch((e) => console.warn('Audio play failed:', e))
    }
  },

  // Reset
  reset: () => set({
    currentMatch: null,
    playerEntry: null,
    opponents: [],
    currentPrice: 0,
    priceHistory: [],
    countdown: 0,
    isPredicting: false,
    isClaiming: false,
    txSignature: null,
    txStatus: 'idle',
    optimisticPrediction: null,
    wsConnected: false,
    priceWsConnected: false,
    matchWsConnected: false,
  }),
}))
