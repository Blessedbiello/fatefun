'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Proposal, ProposalStatus, ProposalFilters } from '@/types/council'
import { ProposalCard } from './ProposalCard'
import { Search, Filter, TrendingUp, Clock, Target } from 'lucide-react'

interface ProposalBrowserProps {
  proposals: Proposal[]
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

export function ProposalBrowser({ proposals, isLoading = false }: ProposalBrowserProps) {
  const [filters, setFilters] = useState<ProposalFilters>({
    sortBy: 'volume',
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Apply filters and sorting
  const filteredProposals = useMemo(() => {
    let result = [...proposals]

    // Filter by status
    if (filters.status) {
      result = result.filter((p) => p.status === filters.status)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((p) =>
        p.marketName.toLowerCase().includes(query) ||
        p.marketDescription.toLowerCase().includes(query)
      )
    }

    // Sort
    switch (filters.sortBy) {
      case 'volume':
        result.sort((a, b) => Number(b.totalVolume) - Number(a.totalVolume))
        break
      case 'timeRemaining':
        result.sort((a, b) => Number(a.votingEnds) - Number(b.votingEnds))
        break
      case 'passProbability':
        result.sort((a, b) => {
          const aProb = Number(a.passPool) / (Number(a.passPool) + Number(a.failPool))
          const bProb = Number(b.passPool) / (Number(b.passPool) + Number(b.failPool))
          return bProb - aProb
        })
        break
    }

    return result
  }, [proposals, filters, searchQuery])

  // Get featured/trending (highest volume active proposals)
  const featuredProposals = useMemo(() => {
    return proposals
      .filter((p) => p.status === ProposalStatus.Active)
      .sort((a, b) => Number(b.totalVolume) - Number(a.totalVolume))
      .slice(0, 3)
  }, [proposals])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
            Oracle Council
          </h1>
          <p className="text-gray-400">
            Futarchy governance: let markets decide which prediction markets to add
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-xs text-gray-500">Active</div>
            <div className="text-xl font-bold text-green-400">
              {proposals.filter((p) => p.status === ProposalStatus.Active).length}
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-xs text-gray-500">Passed</div>
            <div className="text-xl font-bold text-purple-400">
              {proposals.filter((p) => p.status === ProposalStatus.Passed || p.status === ProposalStatus.Executed).length}
            </div>
          </div>
        </div>
      </div>

      {/* Featured/Trending Section */}
      {featuredProposals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Trending Proposals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredProposals.map((proposal) => (
              <ProposalCard key={proposal.publicKey.toString()} proposal={proposal} />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as ProposalStatus || undefined })}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
        >
          <option value="">All Status</option>
          <option value={ProposalStatus.Active}>Active</option>
          <option value={ProposalStatus.Passed}>Passed</option>
          <option value={ProposalStatus.Rejected}>Rejected</option>
          <option value={ProposalStatus.Executed}>Executed</option>
        </select>

        {/* Sort By */}
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
        >
          <option value="volume">Sort by Volume</option>
          <option value="timeRemaining">Sort by Time Remaining</option>
          <option value="passProbability">Sort by Pass Probability</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Showing {filteredProposals.length} {filteredProposals.length === 1 ? 'proposal' : 'proposals'}
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-purple-400 hover:text-purple-300"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Proposals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-purple-400 text-2xl">
              🏛️
            </div>
          </div>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">No proposals found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Be the first to create a proposal!'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => window.location.href = '/council/create'}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Create Proposal
            </button>
          )}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProposals.map((proposal) => (
            <motion.div key={proposal.publicKey.toString()} variants={item} layout>
              <ProposalCard proposal={proposal} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
