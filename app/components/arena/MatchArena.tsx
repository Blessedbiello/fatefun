'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Match, MatchStatus } from '@/types/arena'
import { PredictionPanel } from './PredictionPanel'
import { PlayerList } from './PlayerList'
import { MatchResult } from './MatchResult'
import { TrendingUp, TrendingDown, Clock, Coins, Users } from 'lucide-react'

interface MatchArenaProps {
  match: Match
  currentPrice?: number
  onPredict?: (side: 'higher' | 'lower') => Promise<void>
}

export function MatchArena({ match, currentPrice = 0, onPredict }: MatchArenaProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() / 1000

      if (match.status === MatchStatus.Open) {
        const remaining = Number(match.predictionDeadline) - now
        setTimeRemaining(Math.max(0, remaining))
      } else if (match.status === MatchStatus.InProgress) {
        const remaining = Number(match.resolutionTime) - now
        setTimeRemaining(Math.max(0, remaining))
      } else {
        setTimeRemaining(0)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [match])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const priceChange = currentPrice - Number(match.startingPrice)
  const priceChangePercent = (priceChange / Number(match.startingPrice)) * 100

  const totalPot = Number(match.entryFee) * match.currentPlayers

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {match.marketName || 'SOL/USD'} Arena
          </h1>
          <p className="text-gray-400">
            Match #{match.matchId.toString()}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Total Pot */}
          <div className="px-4 py-2 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Total Pot</div>
            <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {totalPot.toFixed(2)} SOL
            </div>
          </div>

          {/* Timer */}
          <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Clock size={12} />
              {match.status === MatchStatus.Open ? 'Predictions Close' : 'Resolution'}
            </div>
            <div className={`text-xl font-bold ${timeRemaining < 60 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Players */}
          <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Users size={12} />
              Players
            </div>
            <div className="text-xl font-bold text-white">
              {match.currentPlayers}/{match.maxPlayers}
            </div>
          </div>
        </div>
      </div>

      {/* Price Chart Area */}
      <div className="relative h-96 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {/* Price Display Overlay */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div className="px-4 py-2 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Current Price</div>
            <div className="text-3xl font-bold text-white">
              ${currentPrice.toFixed(2)}
            </div>
          </div>

          <div className="px-4 py-2 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Change</div>
            <div className={`text-xl font-bold flex items-center gap-1 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </div>
          </div>

          <div className="px-4 py-2 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Starting Price</div>
            <div className="text-lg font-medium text-gray-300">
              ${Number(match.startingPrice).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-400 text-sm">
              TradingView Chart Integration
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Real-time price data from Pyth Network
            </p>
          </div>
        </div>

        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction Panel (2/3 width) */}
        <div className="lg:col-span-2">
          {match.status === MatchStatus.Completed ? (
            <MatchResult match={match} currentPrice={currentPrice} />
          ) : (
            <PredictionPanel
              match={match}
              disabled={match.status !== MatchStatus.Open || timeRemaining === 0}
              onPredict={onPredict}
            />
          )}
        </div>

        {/* Player List (1/3 width) */}
        <div className="lg:col-span-1">
          <PlayerList match={match} />
        </div>
      </div>

      {/* Match Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Entry Fee</div>
          <div className="text-lg font-bold text-white flex items-center gap-1">
            <Coins size={16} className="text-yellow-400" />
            {Number(match.entryFee).toFixed(2)} SOL
          </div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Higher Pool</div>
          <div className="text-lg font-bold text-green-400">
            {Number(match.higherPool).toFixed(2)} SOL
          </div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Lower Pool</div>
          <div className="text-lg font-bold text-red-400">
            {Number(match.lowerPool).toFixed(2)} SOL
          </div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Status</div>
          <div className="text-lg font-bold">
            {match.status === MatchStatus.Open && '🟡 Open'}
            {match.status === MatchStatus.InProgress && '🟢 In Progress'}
            {match.status === MatchStatus.Completed && '⚫ Completed'}
            {match.status === MatchStatus.Cancelled && '🔴 Cancelled'}
          </div>
        </div>
      </div>
    </div>
  )
}
