'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Proposal, TradeEstimate } from '@/types/council'
import { ProposalResult } from './ProposalResult'
import { TrendingUp, TrendingDown, Info, Clock, User, AlertTriangle } from 'lucide-react'

interface ProposalDetailProps {
  proposal: Proposal
  userVote?: { passAmount: bigint; failAmount: bigint }
  onTrade?: (side: 'pass' | 'fail', amount: number) => Promise<void>
}

export function ProposalDetail({ proposal, userVote, onTrade }: ProposalDetailProps) {
  const [tradeAmount, setTradeAmount] = useState<{ pass: string; fail: string }>({
    pass: '',
    fail: '',
  })
  const [isTrading, setIsTrading] = useState(false)
  const [tradingSide, setTradingSide] = useState<'pass' | 'fail' | null>(null)

  // Calculate pass probability
  const totalPool = Number(proposal.passPool) + Number(proposal.failPool)
  const passProbability = totalPool > 0
    ? (Number(proposal.passPool) / totalPool) * 100
    : 50

  // Estimate trade outcomes using AMM formula
  const estimateTrade = (side: 'pass' | 'fail', amountSol: number): TradeEstimate | null => {
    if (amountSol <= 0) return null

    const amountLamports = amountSol * 1e9

    if (side === 'pass') {
      const newPassPool = Number(proposal.passPool) + amountLamports
      const newTotalPool = newPassPool + Number(proposal.failPool)
      const newPassPrice = (Number(proposal.failPool) / newTotalPool) * 10000

      return {
        amountIn: amountSol,
        sharesOut: amountSol, // 1:1 for simplicity
        pricePerShare: newPassPrice / 10000,
        newPrice: newPassPrice,
        priceImpact: ((newPassPrice - proposal.passPrice) / proposal.passPrice) * 100,
      }
    } else {
      const newFailPool = Number(proposal.failPool) + amountLamports
      const newTotalPool = Number(proposal.passPool) + newFailPool
      const newFailPrice = (Number(proposal.passPool) / newTotalPool) * 10000

      return {
        amountIn: amountSol,
        sharesOut: amountSol,
        pricePerShare: newFailPrice / 10000,
        newPrice: newFailPrice,
        priceImpact: ((newFailPrice - proposal.failPrice) / proposal.failPrice) * 100,
      }
    }
  }

  const passEstimate = useMemo(
    () => estimateTrade('pass', parseFloat(tradeAmount.pass) || 0),
    [tradeAmount.pass, proposal]
  )

  const failEstimate = useMemo(
    () => estimateTrade('fail', parseFloat(tradeAmount.fail) || 0),
    [tradeAmount.fail, proposal]
  )

  const handleTrade = async (side: 'pass' | 'fail') => {
    const amount = parseFloat(side === 'pass' ? tradeAmount.pass : tradeAmount.fail)
    if (!amount || amount <= 0 || !onTrade) return

    setIsTrading(true)
    setTradingSide(side)

    try {
      await onTrade(side, amount)
      // Reset form
      setTradeAmount({ pass: '', fail: '' })
    } catch (error) {
      console.error('Trade failed:', error)
    } finally {
      setIsTrading(false)
      setTradingSide(null)
    }
  }

  // Show result if proposal is resolved
  if (proposal.status === 'Passed' || proposal.status === 'Rejected' || proposal.status === 'Executed') {
    return <ProposalResult proposal={proposal} userVote={userVote} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">{proposal.marketName}</h1>
        <p className="text-gray-400">{proposal.marketDescription}</p>
      </div>

      {/* Visual Pool Display - Tug of War */}
      <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-400 mb-2">Market Prediction</div>
          <div className={`text-6xl font-bold ${passProbability >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {passProbability.toFixed(1)}%
          </div>
          <div className="text-gray-300 mt-2">
            believe this proposal will <span className="font-bold">{passProbability >= 50 ? 'PASS' : 'FAIL'}</span>
          </div>
        </div>

        {/* Animated Tug of War Bar */}
        <div className="relative">
          <div className="h-12 bg-gray-900 rounded-full overflow-hidden flex relative">
            <motion.div
              animate={{ width: `${passProbability}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-start px-4"
            >
              {passProbability > 20 && (
                <span className="text-white font-bold text-sm">PASS</span>
              )}
            </motion.div>

            <motion.div
              animate={{ width: `${100 - passProbability}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-end px-4"
            >
              {100 - passProbability > 20 && (
                <span className="text-white font-bold text-sm">FAIL</span>
              )}
            </motion.div>

            {/* Center line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-white/50" />
          </div>

          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-400 font-bold">
              {(Number(proposal.passPool) / 1e9).toFixed(2)} SOL
            </span>
            <span className="text-red-400 font-bold">
              {(Number(proposal.failPool) / 1e9).toFixed(2)} SOL
            </span>
          </div>
        </div>

        {/* Current Prices */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-xs text-green-400 mb-1">PASS Price</div>
            <div className="text-2xl font-bold text-green-400">
              {(proposal.passPrice / 100).toFixed(2)}¢
            </div>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-xs text-red-400 mb-1">FAIL Price</div>
            <div className="text-2xl font-bold text-red-400">
              {(proposal.failPrice / 100).toFixed(2)}¢
            </div>
          </div>
        </div>
      </div>

      {/* Trading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BET PASS */}
        <div className="p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-2 border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-400">Bet PASS</h3>
              <p className="text-xs text-gray-400">You believe this proposal will pass</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Amount (SOL)</label>
              <input
                type="number"
                value={tradeAmount.pass}
                onChange={(e) => setTradeAmount({ ...tradeAmount, pass: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.1"
                className="w-full px-4 py-3 bg-gray-900 border border-green-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white text-lg"
              />
            </div>

            {passEstimate && (
              <div className="p-3 bg-gray-900/50 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Shares Received:</span>
                  <span className="text-white font-medium">{passEstimate.sharesOut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New Price:</span>
                  <span className="text-white font-medium">{(passEstimate.newPrice / 100).toFixed(2)}¢</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className={`font-medium ${passEstimate.priceImpact > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {passEstimate.priceImpact.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTrade('pass')}
              disabled={!tradeAmount.pass || parseFloat(tradeAmount.pass) <= 0 || isTrading}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              {isTrading && tradingSide === 'pass' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Trading...
                </span>
              ) : (
                'Buy PASS Tokens'
              )}
            </motion.button>
          </div>
        </div>

        {/* BET FAIL */}
        <div className="p-6 bg-gradient-to-br from-red-900/20 to-rose-900/20 border-2 border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <TrendingDown size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-400">Bet FAIL</h3>
              <p className="text-xs text-gray-400">You believe this proposal will fail</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Amount (SOL)</label>
              <input
                type="number"
                value={tradeAmount.fail}
                onChange={(e) => setTradeAmount({ ...tradeAmount, fail: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.1"
                className="w-full px-4 py-3 bg-gray-900 border border-red-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white text-lg"
              />
            </div>

            {failEstimate && (
              <div className="p-3 bg-gray-900/50 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Shares Received:</span>
                  <span className="text-white font-medium">{failEstimate.sharesOut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New Price:</span>
                  <span className="text-white font-medium">{(failEstimate.newPrice / 100).toFixed(2)}¢</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className={`font-medium ${failEstimate.priceImpact > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {failEstimate.priceImpact.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTrade('fail')}
              disabled={!tradeAmount.fail || parseFloat(tradeAmount.fail) <= 0 || isTrading}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-700 hover:to-rose-700 transition-all"
            >
              {isTrading && tradingSide === 'fail' ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Trading...
                </span>
              ) : (
                'Buy FAIL Tokens'
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Proposer Info */}
        <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-purple-400" />
            Proposer
          </h3>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Address</div>
              <div className="text-sm font-mono text-white">
                {proposal.proposer.toString().slice(0, 8)}...{proposal.proposer.toString().slice(-8)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Pyth Price Feed</div>
              <div className="text-sm font-mono text-white">
                {proposal.pythPriceFeed.toString().slice(0, 8)}...{proposal.pythPriceFeed.toString().slice(-8)}
              </div>
            </div>
          </div>
        </div>

        {/* Voting Info */}
        <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-yellow-400" />
            Voting Period
          </h3>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Ends At</div>
              <div className="text-sm text-white">
                {new Date(Number(proposal.votingEnds) * 1000).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Volume</div>
              <div className="text-sm text-white font-bold">
                {(Number(proposal.totalVolume) / 1e9).toFixed(2)} SOL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Rules */}
      <div className="p-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
          <Info size={20} />
          Resolution Rules
        </h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">•</span>
            <span>Proposal passes if <span className="font-bold text-green-400">PASS price {'<'} FAIL price</span> when voting ends</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">•</span>
            <span>Winners split the losing pool proportionally to their stake</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">•</span>
            <span>If passed, proposer gets stake back + 2% bonus from total volume</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">•</span>
            <span>If passed, the market is automatically created in FATE Arena</span>
          </li>
        </ul>
      </div>

      {/* Your Position */}
      {userVote && (Number(userVote.passAmount) > 0 || Number(userVote.failAmount) > 0) && (
        <div className="p-6 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <h3 className="text-lg font-bold text-purple-400 mb-4">Your Position</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">PASS Tokens</div>
              <div className="text-2xl font-bold text-green-400">
                {(Number(userVote.passAmount) / 1e9).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">FAIL Tokens</div>
              <div className="text-2xl font-bold text-red-400">
                {(Number(userVote.failAmount) / 1e9).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
