'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MatchType } from '@/types/arena'
import { Coins, Users, Clock, Target, Zap } from 'lucide-react'

interface CreateMatchFormProps {
  onSubmit?: (params: CreateMatchParams) => Promise<void>
}

export interface CreateMatchParams {
  marketId: number
  matchType: MatchType
  entryFee: number
  maxPlayers: number
  predictionWindow: number
  resolutionTime: number
}

const MARKETS = [
  { id: 0, name: 'SOL/USD', symbol: 'SOL' },
  { id: 1, name: 'BTC/USD', symbol: 'BTC' },
  { id: 2, name: 'ETH/USD', symbol: 'ETH' },
]

const MATCH_TYPES = [
  { type: MatchType.FlashDuel, name: 'Flash Duel', icon: '⚡', desc: '1v1 quick battle' },
  { type: MatchType.BattleRoyale, name: 'Battle Royale', icon: '👑', desc: 'Last one standing wins' },
  { type: MatchType.Tournament, name: 'Tournament', icon: '🏆', desc: 'Structured competition' },
]

const PREDICTION_WINDOWS = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 1800, label: '30 minutes' },
]

const RESOLUTION_TIMES = [
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
]

export function CreateMatchForm({ onSubmit }: CreateMatchFormProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState<CreateMatchParams>({
    marketId: 0,
    matchType: MatchType.FlashDuel,
    entryFee: 0.1,
    maxPlayers: 2,
    predictionWindow: 300,
    resolutionTime: 600,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      if (onSubmit) {
        await onSubmit(formData)
      }
      // Redirect to arena after creation
      router.push('/arena')
    } catch (error) {
      console.error('Failed to create match:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const totalPot = formData.entryFee * formData.maxPlayers

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
          Create Match
        </h1>
        <p className="text-gray-400">Set up a new prediction battle</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Market Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Target size={16} />
            Market
          </label>
          <select
            value={formData.marketId}
            onChange={(e) => setFormData({ ...formData, marketId: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            {MARKETS.map((market) => (
              <option key={market.id} value={market.id}>
                {market.name}
              </option>
            ))}
          </select>
        </div>

        {/* Match Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Zap size={16} />
            Match Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {MATCH_TYPES.map(({ type, name, icon, desc }) => (
              <motion.button
                key={type}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormData({ ...formData, matchType: type })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.matchType === type
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-sm font-medium text-white">{name}</div>
                <div className="text-xs text-gray-400 mt-1">{desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Entry Fee */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Coins size={16} />
            Entry Fee (SOL)
          </label>
          <input
            type="number"
            min="0.05"
            max="10"
            step="0.05"
            value={formData.entryFee}
            onChange={(e) => setFormData({ ...formData, entryFee: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          />
          <p className="text-xs text-gray-500">Range: 0.05 - 10 SOL</p>
        </div>

        {/* Max Players */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Users size={16} />
            Max Players
          </label>
          <input
            type="number"
            min="2"
            max="10"
            value={formData.maxPlayers}
            onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          />
          <p className="text-xs text-gray-500">Range: 2 - 10 players</p>
        </div>

        {/* Prediction Window */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Clock size={16} />
            Prediction Window
          </label>
          <select
            value={formData.predictionWindow}
            onChange={(e) => setFormData({ ...formData, predictionWindow: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            {PREDICTION_WINDOWS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Time allowed for players to join and predict</p>
        </div>

        {/* Resolution Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Clock size={16} />
            Resolution Time
          </label>
          <select
            value={formData.resolutionTime}
            onChange={(e) => setFormData({ ...formData, resolutionTime: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            {RESOLUTION_TIMES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Time before match is resolved</p>
        </div>

        {/* Settings Preview */}
        <div className="p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4">Match Preview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Entry Fee</div>
              <div className="text-lg font-bold text-purple-400">{formData.entryFee} SOL</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Total Pot</div>
              <div className="text-lg font-bold text-pink-400">{totalPot.toFixed(2)} SOL</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Max Players</div>
              <div className="text-lg font-bold text-white">{formData.maxPlayers}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Match Type</div>
              <div className="text-lg font-bold text-white">
                {MATCH_TYPES.find((t) => t.type === formData.matchType)?.icon}{' '}
                {MATCH_TYPES.find((t) => t.type === formData.matchType)?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isCreating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating Match...
            </span>
          ) : (
            'Create Match'
          )}
        </motion.button>
      </form>
    </div>
  )
}
