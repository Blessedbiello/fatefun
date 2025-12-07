'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Match, MatchFilters, MatchStatus, MatchType, SortOption } from '@/types/arena'
import { MatchCard } from './MatchCard'
import { Filter, SortAsc, Search } from 'lucide-react'

interface MatchBrowserProps {
  matches: Match[]
  isLoading?: boolean
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function MatchBrowser({ matches, isLoading }: MatchBrowserProps) {
  const [filters, setFilters] = useState<MatchFilters>({})
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchTerm, setSearchTerm] = useState('')

  // Apply filters
  const filteredMatches = matches.filter((match) => {
    if (filters.status && match.status !== filters.status) return false
    if (filters.matchType && match.matchType !== filters.matchType) return false
    if (filters.marketId !== undefined && match.marketId !== filters.marketId) return false
    if (filters.minEntryFee && match.entryFee < filters.minEntryFee) return false
    if (filters.maxEntryFee && match.entryFee > filters.maxEntryFee) return false
    return true
  })

  // Apply sorting
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return Number(b.createdAt - a.createdAt)
      case 'entry_fee':
        return Number(b.entryFee - a.entryFee)
      case 'players':
        return b.currentPlayers - a.currentPlayers
      default:
        return 0
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-purple-400 text-2xl">⚔️</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Arena
          </h1>
          <p className="text-gray-400 mt-1">
            {sortedMatches.length} {sortedMatches.length === 1 ? 'match' : 'matches'} available
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: e.target.value ? (e.target.value as MatchStatus) : undefined,
            }))
          }
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
        >
          <option value="">All Status</option>
          <option value={MatchStatus.Open}>Open</option>
          <option value={MatchStatus.InProgress}>In Progress</option>
          <option value={MatchStatus.Completed}>Completed</option>
        </select>

        {/* Match Type Filter */}
        <select
          value={filters.matchType || ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              matchType: e.target.value ? (e.target.value as MatchType) : undefined,
            }))
          }
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
        >
          <option value="">All Types</option>
          <option value={MatchType.FlashDuel}>⚡ Flash Duel</option>
          <option value={MatchType.BattleRoyale}>👑 Battle Royale</option>
          <option value={MatchType.Tournament}>🏆 Tournament</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white flex items-center gap-2"
        >
          <option value="newest">Newest First</option>
          <option value="entry_fee">Highest Entry Fee</option>
          <option value="players">Most Players</option>
        </select>

        {/* Clear Filters */}
        {(filters.status || filters.matchType) && (
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Match Grid */}
      {sortedMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="text-6xl mb-4">⚔️</div>
          <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
          <p className="text-gray-400 mb-6">
            {matches.length === 0
              ? 'Be the first to create a match!'
              : 'Try adjusting your filters'}
          </p>
          <button
            onClick={() => window.location.href = '/arena/create'}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Create Match
          </button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {sortedMatches.map((match) => (
              <motion.div key={match.publicKey.toString()} variants={item} layout>
                <MatchCard match={match} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
