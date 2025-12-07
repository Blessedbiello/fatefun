'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { LeaderboardEntry, LeaderboardPeriod } from '@/types/profile'
import { ProfileCardCompact } from './ProfileCard'
import { Trophy, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Minus } from 'lucide-react'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  period: LeaderboardPeriod
  onPeriodChange: (period: LeaderboardPeriod) => void
  isLoading?: boolean
}

export function Leaderboard({ entries, period, onPeriodChange, isLoading = false }: LeaderboardProps) {
  const { publicKey } = useWallet()
  const [currentPage, setCurrentPage] = useState(1)
  const entriesPerPage = 20

  // Pagination
  const totalPages = Math.ceil(entries.length / entriesPerPage)
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    return entries.slice(start, start + entriesPerPage)
  }, [entries, currentPage, entriesPerPage])

  // Find current user's entry
  const userEntry = publicKey ? entries.find((e) => e.player.toString() === publicKey.toString()) : null

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: '🥇', color: 'from-yellow-500 to-orange-500', text: '1st' }
    if (rank === 2) return { icon: '🥈', color: 'from-gray-400 to-gray-500', text: '2nd' }
    if (rank === 3) return { icon: '🥉', color: 'from-orange-700 to-orange-800', text: '3rd' }
    return null
  }

  const getRankMovement = (entry: LeaderboardEntry) => {
    if (!entry.previousRank) return null

    const movement = entry.previousRank - entry.rank

    if (movement > 0) {
      return { icon: <ChevronUp size={16} />, color: 'text-green-400', text: `+${movement}` }
    } else if (movement < 0) {
      return { icon: <ChevronDown size={16} />, color: 'text-red-400', text: `${movement}` }
    }

    return { icon: <Minus size={16} />, color: 'text-gray-500', text: '—' }
  }

  const getPeriodLabel = (p: LeaderboardPeriod) => {
    const labels = {
      [LeaderboardPeriod.AllTime]: 'All Time',
      [LeaderboardPeriod.Week]: 'This Week',
      [LeaderboardPeriod.Day]: 'Today',
    }
    return labels[p]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-400">Top players in FATE Protocol</p>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 p-1 bg-gray-800 border border-gray-700 rounded-lg">
          {Object.values(LeaderboardPeriod).map((p) => (
            <button
              key={p}
              onClick={() => {
                onPeriodChange(p)
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 rounded-lg"
          >
            <div className="text-center">
              <div className="text-5xl mb-3">🥈</div>
              <ProfileCardCompact
                publicKey={entries[1].player}
                username={entries[1].username}
                level={entries[1].level}
              />
              <div className="mt-4 space-y-2">
                <div className="text-2xl font-bold text-gray-300">{entries[1].wins}W</div>
                <div className="text-sm text-gray-400">{entries[1].winRate.toFixed(1)}% WR</div>
                <div className="text-sm text-green-400 font-bold">
                  {(Number(entries[1].totalWon) / 1e9).toFixed(2)} SOL
                </div>
              </div>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-br from-yellow-600/30 to-orange-600/30 border-2 border-yellow-500 rounded-lg relative"
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="px-4 py-1 bg-yellow-500 rounded-full text-sm font-bold text-black">
                👑 CHAMPION
              </div>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-3">🥇</div>
              <ProfileCardCompact
                publicKey={entries[0].player}
                username={entries[0].username}
                level={entries[0].level}
              />
              <div className="mt-4 space-y-2">
                <div className="text-3xl font-bold text-yellow-400">{entries[0].wins}W</div>
                <div className="text-sm text-gray-300">{entries[0].winRate.toFixed(1)}% WR</div>
                <div className="text-lg text-green-400 font-bold">
                  {(Number(entries[0].totalWon) / 1e9).toFixed(2)} SOL
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/30 border-2 border-orange-700 rounded-lg"
          >
            <div className="text-center">
              <div className="text-5xl mb-3">🥉</div>
              <ProfileCardCompact
                publicKey={entries[2].player}
                username={entries[2].username}
                level={entries[2].level}
              />
              <div className="mt-4 space-y-2">
                <div className="text-2xl font-bold text-orange-400">{entries[2].wins}W</div>
                <div className="text-sm text-gray-400">{entries[2].winRate.toFixed(1)}% WR</div>
                <div className="text-sm text-green-400 font-bold">
                  {(Number(entries[2].totalWon) / 1e9).toFixed(2)} SOL
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* User's Position (if not in top 3) */}
      {userEntry && userEntry.rank > 3 && (
        <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500 rounded-lg">
          <div className="text-sm text-purple-400 mb-2">Your Rank</div>
          <LeaderboardRow entry={userEntry} highlight />
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-3">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-400">
            <div className="col-span-1">RANK</div>
            <div className="col-span-4">PLAYER</div>
            <div className="col-span-1 text-right">WINS</div>
            <div className="col-span-2 text-right">WIN RATE</div>
            <div className="col-span-2 text-right">TOTAL WON</div>
            <div className="col-span-2 text-right">STREAK</div>
          </div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-purple-400 text-2xl">
                🏆
              </div>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-white mb-2">No rankings yet</h3>
            <p className="text-gray-400">Be the first to play and claim the top spot!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {paginatedEntries.map((entry) => (
              <LeaderboardRow
                key={entry.player.toString()}
                entry={entry}
                highlight={publicKey?.toString() === entry.player.toString()}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function LeaderboardRow({ entry, highlight = false }: { entry: LeaderboardEntry; highlight?: boolean }) {
  const rankBadge = getRankBadge(entry.rank)
  const movement = getRankMovement(entry)

  return (
    <div className={`px-6 py-4 ${highlight ? 'bg-purple-900/20' : 'hover:bg-gray-750'} transition-colors`}>
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Rank */}
        <div className="col-span-1">
          <div className="flex items-center gap-2">
            {rankBadge ? (
              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${rankBadge.color} text-white font-bold text-sm flex items-center gap-1`}>
                <span>{rankBadge.icon}</span>
                <span>{rankBadge.text}</span>
              </div>
            ) : (
              <div className="text-lg font-bold text-gray-400">#{entry.rank}</div>
            )}
          </div>
        </div>

        {/* Player */}
        <div className="col-span-4">
          <ProfileCardCompact
            publicKey={entry.player}
            username={entry.username}
            level={entry.level}
          />
        </div>

        {/* Wins */}
        <div className="col-span-1 text-right">
          <div className="font-bold text-white">{entry.wins}</div>
          <div className="text-xs text-gray-500">{entry.totalMatches} total</div>
        </div>

        {/* Win Rate */}
        <div className="col-span-2 text-right">
          <div className={`font-bold ${entry.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {entry.winRate.toFixed(1)}%
          </div>
        </div>

        {/* Total Won */}
        <div className="col-span-2 text-right">
          <div className="font-bold text-green-400">
            {(Number(entry.totalWon) / 1e9).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">SOL</div>
        </div>

        {/* Streak */}
        <div className="col-span-2 text-right">
          <div className="flex items-center justify-end gap-2">
            {entry.currentStreak > 0 && (
              <span className="text-yellow-400">🔥</span>
            )}
            <span className="font-bold text-white">{entry.currentStreak}</span>
            {movement && (
              <div className={`flex items-center ${movement.color}`}>
                {movement.icon}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getRankBadge(rank: number) {
  if (rank === 1) return { icon: '🥇', color: 'from-yellow-500 to-orange-500', text: '1st' }
  if (rank === 2) return { icon: '🥈', color: 'from-gray-400 to-gray-500', text: '2nd' }
  if (rank === 3) return { icon: '🥉', color: 'from-orange-700 to-orange-800', text: '3rd' }
  return null
}

function getRankMovement(entry: LeaderboardEntry) {
  if (!entry.previousRank) return null

  const movement = entry.previousRank - entry.rank

  if (movement > 0) {
    return { icon: <ChevronUp size={16} />, color: 'text-green-400', text: `+${movement}` }
  } else if (movement < 0) {
    return { icon: <ChevronDown size={16} />, color: 'text-red-400', text: `${movement}` }
  }

  return { icon: <Minus size={16} />, color: 'text-gray-500', text: '—' }
}
