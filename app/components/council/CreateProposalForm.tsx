'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { PublicKey } from '@solana/web3.js'
import { Coins, HelpCircle, AlertCircle, Target } from 'lucide-react'
import { FutarchyExplainer } from './FutarchyExplainer'

interface CreateProposalFormProps {
  councilConfig?: {
    proposalStake: bigint
    votingPeriod: bigint
  }
  onSubmit?: (params: CreateProposalParams) => Promise<void>
}

export interface CreateProposalParams {
  marketName: string
  marketDescription: string
  pythPriceFeed: string
}

const PYTH_PRICE_FEEDS = [
  {
    id: 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG',
    name: 'SOL/USD',
    symbol: 'SOL',
    description: 'Solana price feed',
  },
  {
    id: 'GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU',
    name: 'BTC/USD',
    symbol: 'BTC',
    description: 'Bitcoin price feed',
  },
  {
    id: 'JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB',
    name: 'ETH/USD',
    symbol: 'ETH',
    description: 'Ethereum price feed',
  },
  {
    id: '89GseEmvNkzAMMEXcW9oTYzqRPXTsJ3BmNerXmgA1osV',
    name: 'BONK/USD',
    symbol: 'BONK',
    description: 'Bonk price feed',
  },
]

export function CreateProposalForm({ councilConfig, onSubmit }: CreateProposalFormProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [showExplainer, setShowExplainer] = useState(false)

  const [formData, setFormData] = useState<CreateProposalParams>({
    marketName: '',
    marketDescription: '',
    pythPriceFeed: PYTH_PRICE_FEEDS[0].id,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CreateProposalParams, string>>>({})

  // Validate Pyth price feed
  const validatePriceFeed = (feedId: string): boolean => {
    try {
      new PublicKey(feedId)
      return true
    } catch {
      return false
    }
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}

    if (!formData.marketName.trim()) {
      newErrors.marketName = 'Market name is required'
    } else if (formData.marketName.length < 3) {
      newErrors.marketName = 'Market name must be at least 3 characters'
    } else if (formData.marketName.length > 50) {
      newErrors.marketName = 'Market name must be less than 50 characters'
    }

    if (!formData.marketDescription.trim()) {
      newErrors.marketDescription = 'Description is required'
    } else if (formData.marketDescription.length < 10) {
      newErrors.marketDescription = 'Description must be at least 10 characters'
    } else if (formData.marketDescription.length > 500) {
      newErrors.marketDescription = 'Description must be less than 500 characters'
    }

    if (!validatePriceFeed(formData.pythPriceFeed)) {
      newErrors.pythPriceFeed = 'Invalid Pyth price feed address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsCreating(true)

    try {
      if (onSubmit) {
        await onSubmit(formData)
      }
      router.push('/council')
    } catch (error) {
      console.error('Failed to create proposal:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const stakeAmount = councilConfig ? Number(councilConfig.proposalStake) / 1e9 : 1.0
  const votingPeriodHours = councilConfig ? Number(councilConfig.votingPeriod) / 3600 : 48

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
          Create Proposal
        </h1>
        <p className="text-gray-400">
          Propose a new prediction market for the FATE Arena
        </p>
      </div>

      {/* Futarchy Explainer Toggle */}
      <button
        onClick={() => setShowExplainer(!showExplainer)}
        className="mb-6 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
      >
        <HelpCircle size={20} />
        <span className="font-medium">
          {showExplainer ? 'Hide' : 'Show'} how futarchy voting works
        </span>
      </button>

      {showExplainer && (
        <div className="mb-8">
          <FutarchyExplainer />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Market Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Target size={16} />
            Market Name
          </label>
          <input
            type="text"
            value={formData.marketName}
            onChange={(e) => setFormData({ ...formData, marketName: e.target.value })}
            placeholder="e.g., WIF/USD Prediction Market"
            className={`w-full px-4 py-3 bg-gray-800 border ${
              errors.marketName ? 'border-red-500' : 'border-gray-700'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500`}
          />
          {errors.marketName && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.marketName}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {formData.marketName.length}/50 characters
          </p>
        </div>

        {/* Market Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Market Description
          </label>
          <textarea
            value={formData.marketDescription}
            onChange={(e) => setFormData({ ...formData, marketDescription: e.target.value })}
            placeholder="Describe the prediction market you want to create. What makes this market valuable for FATE Protocol users?"
            rows={5}
            className={`w-full px-4 py-3 bg-gray-800 border ${
              errors.marketDescription ? 'border-red-500' : 'border-gray-700'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 resize-none`}
          />
          {errors.marketDescription && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.marketDescription}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {formData.marketDescription.length}/500 characters
          </p>
        </div>

        {/* Pyth Price Feed Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Pyth Price Feed
          </label>
          <select
            value={formData.pythPriceFeed}
            onChange={(e) => setFormData({ ...formData, pythPriceFeed: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            {PYTH_PRICE_FEEDS.map((feed) => (
              <option key={feed.id} value={feed.id}>
                {feed.name} - {feed.description}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Price feed address: {formData.pythPriceFeed.slice(0, 8)}...{formData.pythPriceFeed.slice(-8)}
          </p>
        </div>

        {/* Stake Amount Display */}
        <div className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Coins className="text-yellow-400" size={20} />
            Proposal Requirements
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Stake Required:</span>
              <span className="text-2xl font-bold text-purple-400">
                {stakeAmount.toFixed(2)} SOL
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Voting Period:</span>
              <span className="text-lg font-medium text-white">
                {votingPeriodHours} hours
              </span>
            </div>

            <div className="pt-3 border-t border-purple-500/30">
              <p className="text-sm text-gray-300">
                ✅ If your proposal passes, you'll receive your stake back <span className="text-purple-400 font-bold">+ 2% bonus</span> from trading volume
              </p>
              <p className="text-sm text-gray-300 mt-2">
                ❌ If it fails, your stake is distributed to traders
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h4 className="text-sm font-bold text-white mb-2">What happens after submission?</h4>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">1.</span>
              <span>Community trades PASS/FAIL outcome tokens using SOL</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">2.</span>
              <span>After {votingPeriodHours}h, if PASS price {'<'} FAIL price, proposal passes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">3.</span>
              <span>If passed, the market is created in FATE Arena</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">4.</span>
              <span>Traders can claim their winnings (winners split losing pool)</span>
            </li>
          </ol>
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
              Creating Proposal...
            </span>
          ) : (
            `Create Proposal (Stake ${stakeAmount.toFixed(2)} SOL)`
          )}
        </motion.button>

        <p className="text-xs text-center text-gray-500">
          By creating a proposal, you agree to stake {stakeAmount.toFixed(2)} SOL which will be locked until resolution
        </p>
      </form>
    </div>
  )
}
