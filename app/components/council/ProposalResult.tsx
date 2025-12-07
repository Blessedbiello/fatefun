'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Proposal } from '@/types/council'
import { Trophy, TrendingUp, TrendingDown, ExternalLink, Share2 } from 'lucide-react'

interface ProposalResultProps {
  proposal: Proposal
  userVote?: {
    passAmount: bigint
    failAmount: bigint
  }
  onClaim?: () => Promise<void>
}

export function ProposalResult({ proposal, userVote, onClaim }: ProposalResultProps) {
  const router = useRouter()
  const [isClaiming, setIsClaiming] = useState(false)

  const passed = proposal.passed ?? (proposal.passPrice < proposal.failPrice)
  const totalPool = Number(proposal.passPool) + Number(proposal.failPool)
  const winningPool = passed ? proposal.passPool : proposal.failPool
  const losingPool = passed ? proposal.failPool : proposal.passPool

  // Calculate user's P&L
  const userPassTokens = userVote ? Number(userVote.passAmount) / 1e9 : 0
  const userFailTokens = userVote ? Number(userVote.failAmount) / 1e9 : 0
  const userWon = passed ? userPassTokens > 0 : userFailTokens > 0
  const userWinningTokens = passed ? userPassTokens : userFailTokens

  // Calculate winnings (simplified)
  const userWinnings = userWon && Number(winningPool) > 0
    ? (userWinningTokens / (Number(winningPool) / 1e9)) * (Number(losingPool) / 1e9)
    : 0

  const userProfit = userWinnings > 0
    ? userWinnings - (userPassTokens + userFailTokens)
    : -(userPassTokens + userFailTokens)

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
      ? `I predicted correctly on "${proposal.marketName}" and won ${userWinnings.toFixed(2)} SOL in FATE Council! 🏛️`
      : `Participated in futarchy governance for FATE Protocol 🏛️`
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
          className="text-9xl mb-6"
        >
          {passed ? '✅' : '❌'}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold mb-2"
        >
          Proposal <span className={passed ? 'text-green-400' : 'text-red-400'}>
            {passed ? 'PASSED' : 'REJECTED'}
          </span>
        </motion.h1>

        <p className="text-xl text-gray-400">{proposal.marketName}</p>
      </div>

      {/* Final Prices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg"
      >
        <h2 className="text-lg font-bold text-white mb-4 text-center">Final Market Prices</h2>

        <div className="grid grid-cols-2 gap-6">
          <div className={`p-6 rounded-lg border-2 ${
            passed
              ? 'bg-green-900/20 border-green-500'
              : 'bg-green-900/10 border-green-500/30'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp size={24} className="text-green-400" />
              <span className="text-lg font-bold text-green-400">PASS</span>
              {passed && <Trophy size={20} className="text-yellow-400" />}
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {(proposal.passPrice / 100).toFixed(2)}¢
              </div>
              <div className="text-sm text-gray-400">
                {(Number(proposal.passPool) / 1e9).toFixed(2)} SOL pool
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg border-2 ${
            !passed
              ? 'bg-red-900/20 border-red-500'
              : 'bg-red-900/10 border-red-500/30'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown size={24} className="text-red-400" />
              <span className="text-lg font-bold text-red-400">FAIL</span>
              {!passed && <Trophy size={20} className="text-yellow-400" />}
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">
                {(proposal.failPrice / 100).toFixed(2)}¢
              </div>
              <div className="text-sm text-gray-400">
                {(Number(proposal.failPool) / 1e9).toFixed(2)} SOL pool
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-500 mb-1">Decision Rule</div>
          <div className="text-lg font-medium text-white">
            PASS price ({(proposal.passPrice / 100).toFixed(2)}¢) {passed ? '<' : '≥'} FAIL price ({(proposal.failPrice / 100).toFixed(2)}¢)
          </div>
          <div className="text-sm text-gray-400 mt-2">
            = Market believes proposal will <span className={`font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
              {passed ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* User's Result */}
      {userVote && (userPassTokens > 0 || userFailTokens > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-8 rounded-lg border-2 ${
            userWon
              ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500'
              : 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-500'
          }`}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">{userWon ? '🎉' : '😔'}</div>
            <h2 className="text-3xl font-bold mb-2">
              {userWon ? 'YOU WON!' : 'YOU LOST'}
            </h2>

            {userWon ? (
              <>
                <div className="text-5xl font-bold text-green-400 my-6">
                  +{userWinnings.toFixed(2)} SOL
                </div>

                <div className="p-4 bg-black/30 rounded-lg mb-6 max-w-md mx-auto">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Your Stake:</span>
                      <span className="text-white">{(userPassTokens + userFailTokens).toFixed(2)} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Share of Losing Pool:</span>
                      <span className="text-green-400">+{(userWinnings - (userPassTokens + userFailTokens)).toFixed(2)} SOL</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-400 font-bold">Total Profit:</span>
                      <span className="text-green-400 font-bold text-lg">+{userProfit.toFixed(2)} SOL</span>
                    </div>
                  </div>
                </div>

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
              </>
            ) : (
              <>
                <div className="text-4xl font-bold text-red-400 my-6">
                  -{Math.abs(userProfit).toFixed(2)} SOL
                </div>

                <div className="p-4 bg-black/30 rounded-lg mb-6 max-w-md mx-auto">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Your Stake:</span>
                      <span className="text-white">{(userPassTokens + userFailTokens).toFixed(2)} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lost to Winners:</span>
                      <span className="text-red-400">-{Math.abs(userProfit).toFixed(2)} SOL</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-400">
                  Better luck next time! Your stake went to the winning side.
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Outcome */}
      {passed && proposal.arenaMarketId !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy size={24} className="text-purple-400" />
            Market Created!
          </h3>

          <p className="text-gray-300 mb-4">
            The {proposal.marketName} market has been created in FATE Arena and is now live for predictions!
          </p>

          <button
            onClick={() => router.push(`/arena?market=${proposal.arenaMarketId}`)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
          >
            <ExternalLink size={20} />
            Go to Market
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Total Volume</div>
          <div className="text-xl font-bold text-white">
            {(Number(proposal.totalVolume) / 1e9).toFixed(2)} SOL
          </div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Unique Traders</div>
          <div className="text-xl font-bold text-white">
            {proposal.uniqueTraders || 0}
          </div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Winning Pool</div>
          <div className="text-xl font-bold text-green-400">
            {(Number(winningPool) / 1e9).toFixed(2)} SOL
          </div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Losing Pool</div>
          <div className="text-xl font-bold text-red-400">
            {(Number(losingPool) / 1e9).toFixed(2)} SOL
          </div>
        </div>
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
        Share Result on Twitter
      </motion.button>

      {/* Back to Council */}
      <div className="text-center">
        <button
          onClick={() => router.push('/council')}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          ← Back to Council
        </button>
      </div>
    </div>
  )
}
