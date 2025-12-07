'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useFateArenaProgram } from '@/hooks/useProgram'
import { useGameStore } from '@/store/gameStore'
import { usePriceSubscription, useMockPriceGenerator } from '@/hooks/usePriceSubscription'
import { useMatchSubscription } from '@/hooks/useMatchSubscription'
import { useGameCountdown } from '@/hooks/useGameCountdown'
import { MatchArena } from '@/components/arena/MatchArena'
import { PriceChart } from '@/components/arena/PriceChart'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useAppStore } from '@/store/useAppStore'
import { PredictionSide } from '@/types/arena'
import { ArrowLeft, Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react'

export default function MatchPage() {
  const params = useParams()
  const router = useRouter()
  const { publicKey } = useWallet()
  const wallet = useWallet()
  const program = useFateArenaProgram()

  // Zustand stores
  const currentMatch = useGameStore((s) => s.currentMatch)
  const currentPrice = useGameStore((s) => s.currentPrice)
  const submitPrediction = useGameStore((s) => s.submitPrediction)
  const claimWinnings = useGameStore((s) => s.claimWinnings)
  const reset = useGameStore((s) => s.reset)
  const isPredicting = useGameStore((s) => s.isPredicting)
  const isClaiming = useGameStore((s) => s.isClaiming)
  const txStatus = useGameStore((s) => s.txStatus)
  const wsConnected = useGameStore((s) => s.wsConnected)
  const priceWsConnected = useGameStore((s) => s.priceWsConnected)
  const matchWsConnected = useGameStore((s) => s.matchWsConnected)
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const toggleSound = useGameStore((s) => s.toggleSound)
  const priceHistory = useGameStore((s) => s.priceHistory)

  const matchPubkey = params.matchId as string

  // Subscribe to match updates via WebSocket/polling
  useMatchSubscription({
    matchPubkey: matchPubkey ? new PublicKey(matchPubkey) : null,
    enabled: !!matchPubkey,
    pollingInterval: 2000,
  })

  // Subscribe to Pyth price updates (only if match is active)
  usePriceSubscription({
    marketId: currentMatch?.marketId || 0,
    enabled: !!currentMatch && currentMatch.status !== 'Completed' && currentMatch.status !== 'Cancelled',
    pollingInterval: 2000,
  })

  // DEVELOPMENT: Mock price generator (comment out for production)
  // Uncomment this for testing without Pyth
  // useMockPriceGenerator({
  //   basePrice: Number(currentMatch?.startingPrice || 100),
  //   enabled: !!currentMatch && process.env.NODE_ENV === 'development',
  // })

  // Countdown timer with auto-refresh on end
  const { countdown, formattedTime, isWarning, isCritical } = useGameCountdown({
    enabled: !!currentMatch,
    onCountdownEnd: () => {
      console.log('⏰ Timer ended - match status should update via subscription')

      // Optionally show notification
      useAppStore.getState().addNotification({
        type: 'info',
        title: 'Timer Ended',
        message: 'Match status is updating...',
      })
    },
    onWarning: (seconds) => {
      if (seconds === 60) {
        useAppStore.getState().addNotification({
          type: 'warning',
          title: '1 Minute Remaining!',
          message: 'Make your prediction now',
        })
      }
    },
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  // Handle prediction submission
  const handlePredict = async (side: 'higher' | 'lower') => {
    if (!program || !wallet) {
      useAppStore.getState().addNotification({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet first',
      })
      return
    }

    try {
      const predictionSide = side === 'higher' ? PredictionSide.Higher : PredictionSide.Lower
      await submitPrediction(predictionSide, program, wallet)
    } catch (error) {
      console.error('Prediction submission failed:', error)
      // Error notification handled in gameStore
    }
  }

  // Handle winnings claim
  const handleClaim = async () => {
    if (!program || !wallet) return

    try {
      await claimWinnings(program, wallet)
    } catch (error) {
      console.error('Claim failed:', error)
      // Error notification handled in gameStore
    }
  }

  // Loading state
  if (!currentMatch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-purple-400 text-2xl">⚔️</div>
        </div>
        <div className="ml-4 text-gray-400">Loading match...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.push('/arena')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Arena</span>
            </button>

            {/* Connection Status */}
            <div className="flex items-center gap-4">
              {/* WebSocket Status */}
              <div className="flex items-center gap-2 text-xs">
                {matchWsConnected ? (
                  <>
                    <Wifi size={16} className="text-green-400" />
                    <span className="text-gray-400">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-yellow-400" />
                    <span className="text-gray-400">Polling</span>
                  </>
                )}
              </div>

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
              >
                {soundEnabled ? (
                  <Volume2 size={20} className="text-gray-400" />
                ) : (
                  <VolumeX size={20} className="text-gray-400" />
                )}
              </button>

              {/* Wallet */}
              <WalletButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Price Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            {priceHistory.length > 0 ? (
              <PriceChart match={currentMatch} height={400} />
            ) : (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-400">Waiting for price data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Match Arena */}
          <MatchArena
            match={currentMatch}
            currentPrice={currentPrice}
            onPredict={handlePredict}
          />

          {/* Transaction Status */}
          {txStatus !== 'idle' && (
            <div className={`p-4 rounded-lg border ${
              txStatus === 'pending' ? 'bg-blue-900/20 border-blue-500' :
              txStatus === 'confirmed' ? 'bg-green-900/20 border-green-500' :
              'bg-red-900/20 border-red-500'
            }`}>
              <div className="flex items-center gap-3">
                {txStatus === 'pending' && (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-blue-400">Transaction pending...</span>
                  </>
                )}
                {txStatus === 'confirmed' && (
                  <>
                    <div className="text-green-400 text-xl">✅</div>
                    <span className="text-green-400">Transaction confirmed!</span>
                  </>
                )}
                {txStatus === 'failed' && (
                  <>
                    <div className="text-red-400 text-xl">❌</div>
                    <span className="text-red-400">Transaction failed</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Debug Panel (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="text-sm font-bold text-white mb-2">Debug Info</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="text-white">{currentMatch.status}</div>
                </div>
                <div>
                  <div className="text-gray-500">Countdown</div>
                  <div className={`font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white'}`}>
                    {formattedTime}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Current Price</div>
                  <div className="text-white">${currentPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Price Points</div>
                  <div className="text-white">{priceHistory.length}</div>
                </div>
                <div>
                  <div className="text-gray-500">Match WS</div>
                  <div className={matchWsConnected ? 'text-green-400' : 'text-yellow-400'}>
                    {matchWsConnected ? 'Connected' : 'Polling'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Price WS</div>
                  <div className={priceWsConnected ? 'text-green-400' : 'text-yellow-400'}>
                    {priceWsConnected ? 'Connected' : 'Polling'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Players</div>
                  <div className="text-white">{currentMatch.currentPlayers}/{currentMatch.maxPlayers}</div>
                </div>
                <div>
                  <div className="text-gray-500">Sound</div>
                  <div className="text-white">{soundEnabled ? 'On' : 'Off'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
