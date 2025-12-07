'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Match, PredictionSide } from '@/types/arena'
import { useWallet } from '@solana/wallet-adapter-react'
import { Trophy, TrendingUp, TrendingDown, Award, Share2 } from 'lucide-react'

interface MatchResultProps {
  match: Match
  currentPrice?: number
  onClaim?: () => Promise<void>
}

export function MatchResult({ match, currentPrice = 0, onClaim }: MatchResultProps) {
  const { publicKey } = useWallet()
  const [isClaiming, setIsClaiming] = useState(false)

  // Calculate price change
  const priceChange = currentPrice - Number(match.startingPrice)
  const priceChangePercent = (priceChange / Number(match.startingPrice)) * 100
  const winningSide = priceChange > 0 ? PredictionSide.Higher : PredictionSide.Lower

  // Mock user participation data (replace with actual data from match.players)
  const userEntry = match.players?.find(
    (p) => p.player.toString() === publicKey?.toString()
  )
  const userPrediction = userEntry?.prediction
  const userWon = userPrediction === winningSide
  const userWinnings = userWon ? Number(userEntry?.winnings || 0) : 0
  const hasClaimedWinnings = userEntry?.claimedWinnings || false

  // Calculate pools
  const totalPot = Number(match.higherPool) + Number(match.lowerPool)
  const winningPool = winningSide === PredictionSide.Higher ? match.higherPool : match.lowerPool
  const losingPool = winningSide === PredictionSide.Higher ? match.lowerPool : match.higherPool

  // Get winners and losers
  const winners = match.players?.filter((p) => p.prediction === winningSide) || []
  const losers = match.players?.filter((p) => p.prediction !== winningSide) || []

  const handleClaim = async () => {
    if (!onClaim) return
    setIsClaiming(true)
    try {
      await onClaim()
    } catch (error) {
      console.error('Claim failed:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  const handleShare = () => {
    const text = userWon
      ? `I just won ${userWinnings.toFixed(2)} SOL in a FATE Protocol match! 🏆`
      : `Just played a match in FATE Protocol Arena! ⚔️`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Result Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-8xl mb-4"
        >
          {winningSide === PredictionSide.Higher ? '📈' : '📉'}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-2"
        >
          <span className={winningSide === PredictionSide.Higher ? 'text-green-400' : 'text-red-400'}>
            {winningSide === PredictionSide.Higher ? 'HIGHER' : 'LOWER'}
          </span>
          {' '}wins!
        </motion.h2>

        <p className="text-gray-400 text-lg">Match #{match.matchId.toString()} Complete</p>
      </div>

      {/* Price Change Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-400 mb-2">Starting Price</div>
            <div className="text-2xl font-bold text-white">
              ${Number(match.startingPrice).toFixed(2)}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className={`text-4xl ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400 mb-2">Final Price</div>
            <div className="text-2xl font-bold text-white">
              ${currentPrice.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className={`text-3xl font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </div>
        </div>
      </motion.div>

      {/* User Result */}
      {userEntry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-lg border-2 ${
            userWon
              ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500'
              : 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500'
          }`}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">{userWon ? '🏆' : '😔'}</div>
            <h3 className="text-3xl font-bold mb-2">
              {userWon ? 'YOU WON!' : 'YOU LOST'}
            </h3>

            {userWon ? (
              <>
                <div className="text-5xl font-bold text-green-400 mb-4">
                  +{userWinnings.toFixed(2)} SOL
                </div>

                {!hasClaimedWinnings && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isClaiming ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Claiming...
                      </span>
                    ) : (
                      <>
                        <Trophy size={20} className="inline mr-2" />
                        Claim Winnings
                      </>
                    )}
                  </motion.button>
                )}

                {hasClaimedWinnings && (
                  <div className="px-6 py-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 font-medium">
                    ✅ Winnings Claimed
                  </div>
                )}
              </>
            ) : (
              <div className="text-2xl font-bold text-red-400">
                -{Number(match.entryFee).toFixed(2)} SOL
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Pool Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Total Pot</div>
          <div className="text-xl font-bold text-white">{totalPot.toFixed(2)} SOL</div>
        </div>

        <div className="p-4 bg-gray-800 border border-green-500/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Winning Pool</div>
          <div className="text-xl font-bold text-green-400">{Number(winningPool).toFixed(2)} SOL</div>
        </div>

        <div className="p-4 bg-gray-800 border border-red-500/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Losing Pool</div>
          <div className="text-xl font-bold text-red-400">{Number(losingPool).toFixed(2)} SOL</div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Players</div>
          <div className="text-xl font-bold text-white">{match.currentPlayers}</div>
        </div>
      </motion.div>

      {/* Winners List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <div className="p-4 bg-gray-800 border border-green-500/30 rounded-lg">
          <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
            <Trophy size={20} />
            Winners ({winners.length})
          </h3>
          <div className="space-y-2">
            {winners.slice(0, 5).map((player, idx) => (
              <div
                key={player.player.toString()}
                className="flex items-center justify-between p-2 bg-gray-900/50 rounded"
              >
                <div className="flex items-center gap-2">
                  {idx === 0 && <span className="text-xl">👑</span>}
                  <span className="text-sm text-gray-300 font-mono">
                    {player.player.toString().slice(0, 4)}...{player.player.toString().slice(-4)}
                  </span>
                </div>
                <div className="text-green-400 font-bold">
                  +{Number(player.winnings || 0).toFixed(2)} SOL
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Losers List */}
        {losers.length > 0 && (
          <div className="p-4 bg-gray-800 border border-red-500/30 rounded-lg">
            <h3 className="text-lg font-bold text-red-400 mb-3">
              Losers ({losers.length})
            </h3>
            <div className="space-y-2">
              {losers.slice(0, 5).map((player) => (
                <div
                  key={player.player.toString()}
                  className="flex items-center justify-between p-2 bg-gray-900/50 rounded"
                >
                  <span className="text-sm text-gray-400 font-mono">
                    {player.player.toString().slice(0, 4)}...{player.player.toString().slice(-4)}
                  </span>
                  <div className="text-red-400 font-bold">
                    -{Number(match.entryFee).toFixed(2)} SOL
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Share Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleShare}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
      >
        <Share2 size={20} />
        Share on Twitter
      </motion.button>
    </div>
  )
}
