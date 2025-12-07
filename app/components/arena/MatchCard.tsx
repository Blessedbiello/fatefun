'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Match, MatchStatus, MatchType } from '@/types/arena'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Clock, Users, TrendingUp } from 'lucide-react'

interface MatchCardProps {
  match: Match
  marketName?: string
}

const statusColors = {
  [MatchStatus.Open]: 'bg-green-500/20 text-green-400 border-green-500/30',
  [MatchStatus.InProgress]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  [MatchStatus.Completed]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  [MatchStatus.Cancelled]: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const matchTypeIcons = {
  [MatchType.FlashDuel]: '⚡',
  [MatchType.BattleRoyale]: '👑',
  [MatchType.Tournament]: '🏆',
}

export function MatchCard({ match, marketName = 'SOL/USD' }: MatchCardProps) {
  const router = useRouter()
  const entryFee = Number(match.entryFee) / LAMPORTS_PER_SOL
  const prizePool = Number(match.prizePool) / LAMPORTS_PER_SOL
  const playersText = `${match.currentPlayers}/${match.maxPlayers}`
  const timeRemaining = calculateTimeRemaining(match)

  function calculateTimeRemaining(match: Match): string {
    if (match.status !== MatchStatus.Open) return ''

    const now = Date.now() / 1000
    const createdAt = Number(match.createdAt)
    const predictionWindow = Number(match.predictionWindow)
    const timeLeft = createdAt + predictionWindow - now

    if (timeLeft <= 0) return 'Closing soon'

    const minutes = Math.floor(timeLeft / 60)
    const seconds = Math.floor(timeLeft % 60)

    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/arena/${match.publicKey.toString()}`)}
      className="group relative cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />

      <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
              {matchTypeIcons[match.matchType]}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{marketName}</h3>
              <p className="text-sm text-gray-400">{match.matchType}</p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[match.status]}`}>
            {match.status}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{entryFee.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Entry Fee</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-pink-400 flex items-center justify-center gap-1">
              <Users size={20} />
              {playersText}
            </div>
            <div className="text-xs text-gray-400">Players</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{prizePool.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Prize Pool</div>
          </div>
        </div>

        {/* Time Remaining */}
        {match.status === MatchStatus.Open && timeRemaining && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">{timeRemaining} to join</span>
          </div>
        )}

        {/* In Progress Indicator */}
        {match.status === MatchStatus.InProgress && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse">
            <TrendingUp size={16} className="text-red-400" />
            <span className="text-sm font-medium text-red-400">Battle In Progress</span>
          </div>
        )}

        {/* Completed Prize */}
        {match.status === MatchStatus.Completed && match.winningSide && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <span className="text-sm font-medium text-blue-400">
              Winner: {match.winningSide === 'Higher' ? '📈 HIGHER' : '📉 LOWER'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
