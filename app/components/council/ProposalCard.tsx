'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Proposal, ProposalStatus } from '@/types/council'
import { Clock, TrendingUp, Users, Coins } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProposalCardProps {
  proposal: Proposal
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const router = useRouter()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  // Calculate pass probability (pass_pool / total_pool)
  const totalPool = Number(proposal.passPool) + Number(proposal.failPool)
  const passProbability = totalPool > 0
    ? (Number(proposal.passPool) / totalPool) * 100
    : 50

  // Update time remaining
  useEffect(() => {
    const updateTime = () => {
      const now = Date.now() / 1000
      const remaining = Math.max(0, Number(proposal.votingEnds) - now)
      setTimeRemaining(remaining)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [proposal.votingEnds])

  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'Ended'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const getStatusBadge = () => {
    const badges = {
      [ProposalStatus.Active]: { icon: '🟢', text: 'Active', class: 'bg-green-500/20 border-green-500 text-green-400' },
      [ProposalStatus.Passed]: { icon: '✅', text: 'Passed', class: 'bg-green-500/20 border-green-500 text-green-400' },
      [ProposalStatus.Rejected]: { icon: '❌', text: 'Rejected', class: 'bg-red-500/20 border-red-500 text-red-400' },
      [ProposalStatus.Executed]: { icon: '⚡', text: 'Executed', class: 'bg-purple-500/20 border-purple-500 text-purple-400' },
      [ProposalStatus.Cancelled]: { icon: '🚫', text: 'Cancelled', class: 'bg-gray-500/20 border-gray-500 text-gray-400' },
    }
    return badges[proposal.status]
  }

  const badge = getStatusBadge()

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/council/${proposal.publicKey.toString()}`)}
      className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6 cursor-pointer hover:border-purple-500/50 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">
            {proposal.marketName}
          </h3>
          <p className="text-sm text-gray-400 font-mono">
            by {proposal.proposer.toString().slice(0, 4)}...{proposal.proposer.toString().slice(-4)}
          </p>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${badge.class}`}>
          <span>{badge.icon}</span>
          <span>{badge.text}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 mb-4 line-clamp-2">
        {proposal.marketDescription}
      </p>

      {/* Pass/Fail Price Ratio Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span className="text-green-400">PASS: {passProbability.toFixed(1)}%</span>
          <span className="text-red-400">FAIL: {(100 - passProbability).toFixed(1)}%</span>
        </div>

        <div className="h-4 bg-gray-900 rounded-full overflow-hidden flex relative">
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${passProbability}%` }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500"
          />
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${100 - passProbability}%` }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-red-500 to-rose-500"
          />

          {/* Center divider */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-white/30" />
        </div>

        {/* Pool amounts */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{(Number(proposal.passPool) / 1e9).toFixed(2)} SOL</span>
          <span>{(Number(proposal.failPool) / 1e9).toFixed(2)} SOL</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Time Remaining */}
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className="text-gray-500" />
          <div>
            <div className="text-xs text-gray-500">Time Left</div>
            <div className={`font-medium ${timeRemaining < 3600 ? 'text-yellow-400' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp size={16} className="text-gray-500" />
          <div>
            <div className="text-xs text-gray-500">Volume</div>
            <div className="font-medium text-white">
              {(Number(proposal.totalVolume) / 1e9).toFixed(1)} SOL
            </div>
          </div>
        </div>

        {/* Traders */}
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-gray-500" />
          <div>
            <div className="text-xs text-gray-500">Traders</div>
            <div className="font-medium text-white">
              {proposal.uniqueTraders || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Pass Probability Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Market believes:</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${passProbability >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {passProbability >= 50 ? '✓ WILL PASS' : '✗ WILL FAIL'}
            </span>
            <span className="text-xs text-gray-500">
              ({passProbability >= 50 ? passProbability.toFixed(0) : (100 - passProbability).toFixed(0)}% confidence)
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
