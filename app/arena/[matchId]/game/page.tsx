'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { ModdioGameCanvas } from '@/app/components/arena/ModdioGameCanvas'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export default function GamePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params)
  const router = useRouter()
  const { publicKey } = useWallet()

  const [matchData, setMatchData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch match data from blockchain
    const fetchMatchData = async () => {
      try {
        setIsLoading(true)

        // TODO: Replace with actual blockchain fetch
        // For now, use mock data
        const mockData = {
          matchId: matchId,
          marketName: 'SOL/USD',
          startingPrice: 100.5,
          predictionDeadline: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
          entryFee: 0.1,
          maxPlayers: 10,
          currentPlayers: 3,
        }

        setMatchData(mockData)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch match data:', error)
        setIsLoading(false)
      }
    }

    fetchMatchData()
  }, [matchId])

  const handleGameEnd = (result: any) => {
    console.log('Game ended:', result)

    // Navigate to results page after a short delay
    setTimeout(() => {
      router.push(`/arena/${matchId}/results`)
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-xl font-bold text-white">Loading match...</div>
        </div>
      </div>
    )
  }

  if (!matchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Match Not Found</h1>
          <p className="text-gray-400 mb-6">This match does not exist or has been cancelled</p>
          <button
            onClick={() => router.push('/arena')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium text-white hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Back to Arena
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => router.push('/arena')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Arena</span>
          </motion.button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
                {matchData.marketName} Arena
              </h1>
              <p className="text-gray-400">
                Match ID: {matchId.slice(0, 8)}...{matchId.slice(-8)}
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Entry Fee</div>
              <div className="text-2xl font-bold text-purple-400">
                {matchData.entryFee} SOL
              </div>
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="mb-6">
          <ModdioGameCanvas
            matchId={matchId}
            marketName={matchData.marketName}
            startingPrice={matchData.startingPrice}
            predictionDeadline={matchData.predictionDeadline}
            onGameEnd={handleGameEnd}
          />
        </div>

        {/* Match Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <div className="text-sm text-gray-500 mb-2">Market</div>
            <div className="text-2xl font-bold text-white mb-1">{matchData.marketName}</div>
            <div className="text-sm text-purple-400">
              Starting Price: ${matchData.startingPrice.toFixed(2)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <div className="text-sm text-gray-500 mb-2">Players</div>
            <div className="text-2xl font-bold text-white mb-1">
              {matchData.currentPlayers} / {matchData.maxPlayers}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                style={{ width: `${(matchData.currentPlayers / matchData.maxPlayers) * 100}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <div className="text-sm text-gray-500 mb-2">Prize Pool</div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {(matchData.entryFee * matchData.currentPlayers).toFixed(2)} SOL
            </div>
            <div className="text-sm text-gray-400">
              Winners split 95% of pool
            </div>
          </motion.div>
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-6 bg-purple-900/20 border border-purple-500/30 rounded-lg"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Pro Tips</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Watch the price orb pulse - larger pulses mean bigger price changes</li>
                <li>• Players glow when they've made their prediction</li>
                <li>• Use emotes (1-8) to communicate with other players</li>
                <li>• The timer will shake when less than 10 seconds remain</li>
                <li>• Move with WASD to position yourself strategically (cosmetic only)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
