'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Users, Trophy, Lightbulb, Target, DollarSign } from 'lucide-react'

export function FutarchyExplainer() {
  const steps = [
    {
      icon: <Lightbulb size={24} />,
      title: 'Someone Proposes a Market',
      description: 'A community member stakes SOL to propose adding a new prediction market (e.g., "WIF/USD")',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <DollarSign size={24} />,
      title: 'Community Trades Outcomes',
      description: 'Instead of voting YES/NO, traders buy PASS or FAIL tokens with SOL, creating market prices',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Target size={24} />,
      title: 'Price = Prediction',
      description: 'If more people buy PASS tokens, PASS price goes down (high demand). Lower PASS price = higher confidence it will pass',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Trophy size={24} />,
      title: 'Market Decides',
      description: 'After 48h: if PASS price < FAIL price, proposal passes. Winners split the losing pool. Proposer gets bonus if passed.',
      color: 'from-yellow-500 to-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">What is Futarchy?</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Futarchy is a governance system where <span className="text-purple-400 font-bold">prediction markets</span> make decisions instead of direct voting. It's like letting "the wisdom of the crowd" with real money at stake decide what's best.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white flex-shrink-0`}>
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-gray-500">STEP {index + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Why Futarchy > Direct Voting */}
      <div className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users size={24} className="text-purple-400" />
          Why Prediction Markets {'>'} Direct Voting
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Voting */}
          <div className="space-y-3">
            <div className="text-sm font-bold text-red-400">❌ Traditional Voting Problems:</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0">•</span>
                <span><span className="font-bold">No skin in the game</span> - voters risk nothing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0">•</span>
                <span><span className="font-bold">Mob rule</span> - majority can be wrong</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0">•</span>
                <span><span className="font-bold">No accountability</span> - bad decisions have no consequence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0">•</span>
                <span><span className="font-bold">Politics over truth</span> - voting based on ideology not outcomes</span>
              </li>
            </ul>
          </div>

          {/* Futarchy */}
          <div className="space-y-3">
            <div className="text-sm font-bold text-green-400">✅ Futarchy Benefits:</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 flex-shrink-0">•</span>
                <span><span className="font-bold">Real money at stake</span> - traders lose money if wrong</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 flex-shrink-0">•</span>
                <span><span className="font-bold">Experts rise</span> - informed traders profit, uninformed lose</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 flex-shrink-0">•</span>
                <span><span className="font-bold">Incentivized truth</span> - profit from correct predictions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 flex-shrink-0">•</span>
                <span><span className="font-bold">Self-correcting</span> - market prices aggregate all information</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example */}
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-4">📊 Simple Example</h3>

        <div className="space-y-4 text-sm text-gray-300">
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="font-bold text-purple-400 mb-2">Proposal: "Add BONK/USD market to FATE Arena"</div>
            <div className="space-y-2">
              <div>• Proposer stakes <span className="text-yellow-400">1 SOL</span></div>
              <div>• Traders have 48 hours to trade</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="text-green-400 font-bold mb-2">Alice buys PASS</div>
              <div className="text-xs space-y-1">
                <div>Believes BONK market will be popular</div>
                <div>Trades <span className="text-white">0.5 SOL</span> for PASS tokens</div>
              </div>
            </div>

            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="text-red-400 font-bold mb-2">Bob buys FAIL</div>
              <div className="text-xs space-y-1">
                <div>Thinks BONK is too volatile</div>
                <div>Trades <span className="text-white">0.2 SOL</span> for FAIL tokens</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="font-bold text-purple-400 mb-2">After 48h:</div>
            <div className="space-y-2">
              <div>• PASS pool: <span className="text-green-400">0.5 SOL</span>, FAIL pool: <span className="text-red-400">0.2 SOL</span></div>
              <div>• PASS price = 0.2 / 0.7 = <span className="text-green-400">28.6%</span></div>
              <div>• FAIL price = 0.5 / 0.7 = <span className="text-red-400">71.4%</span></div>
              <div className="text-yellow-400">→ PASS price {'<'} FAIL price = <span className="font-bold">PROPOSAL PASSES ✅</span></div>
              <div>• Alice wins, gets her 0.5 SOL back + share of Bob's 0.2 SOL</div>
              <div>• Proposer gets 1 SOL stake back + 2% bonus</div>
              <div>• BONK/USD market is created in Arena!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div className="p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-2 border-blue-500/50 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💡</div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">The Key Insight</h3>
            <p className="text-gray-300">
              Futarchy turns governance into a <span className="text-blue-400 font-bold">speculative market</span>.
              People who are right make money. People who are wrong lose money.
              Over time, this creates a <span className="text-purple-400 font-bold">self-improving system</span> where
              the best ideas naturally rise to the top, funded by those who believe in them most.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
