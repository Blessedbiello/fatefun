'use client'

import { motion } from 'framer-motion'
import { Match, MatchStatus, PredictionSide } from '@/types/arena'
import { useWallet } from '@solana/wallet-adapter-react'
import { Users, Eye, EyeOff } from 'lucide-react'

interface PlayerListProps {
  match: Match
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
}

export function PlayerList({ match }: PlayerListProps) {
  const { publicKey } = useWallet()

  // Determine if predictions should be hidden
  const hidePredictions = match.status === MatchStatus.Open

  // Get prediction indicator
  const getPredictionDisplay = (prediction?: PredictionSide) => {
    if (hidePredictions || !prediction) {
      return {
        icon: '🤐',
        text: 'Hidden',
        color: 'text-gray-400',
      }
    }

    if (prediction === PredictionSide.Higher) {
      return {
        icon: '📈',
        text: 'HIGHER',
        color: 'text-green-400',
      }
    }

    return {
      icon: '📉',
      text: 'LOWER',
      color: 'text-red-400',
    }
  }

  // Get player status
  const getPlayerStatus = (player: any) => {
    if (match.status === MatchStatus.Completed) {
      // Calculate if player won
      const priceChange = Number(match.endingPrice || 0) - Number(match.startingPrice)
      const winningSide = priceChange > 0 ? PredictionSide.Higher : PredictionSide.Lower
      const won = player.prediction === winningSide

      return {
        icon: won ? '👑' : '💀',
        color: won ? 'text-yellow-400' : 'text-gray-500',
        label: won ? 'Winner' : 'Loser',
      }
    }

    if (player.prediction) {
      return {
        icon: '🟢',
        color: 'text-green-400',
        label: 'Predicted',
      }
    }

    return {
      icon: '🟡',
      color: 'text-yellow-400',
      label: 'Waiting',
    }
  }

  const players = match.players || []
  const emptySlots = match.maxPlayers - players.length

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-purple-400" />
            <h3 className="font-bold text-white">Players</h3>
          </div>
          <div className="text-sm font-medium text-gray-300">
            {players.length}/{match.maxPlayers}
          </div>
        </div>

        {hidePredictions && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <EyeOff size={14} />
            Predictions hidden until match starts
          </div>
        )}
      </div>

      {/* Player List */}
      <div className="max-h-96 overflow-y-auto">
        {players.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-sm">No players yet</p>
            <p className="text-xs mt-1">Be the first to join!</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-gray-700">
            {players.map((player, idx) => {
              const isCurrentUser = player.player.toString() === publicKey?.toString()
              const status = getPlayerStatus(player)
              const prediction = getPredictionDisplay(player.prediction)

              return (
                <motion.div
                  key={player.player.toString()}
                  variants={item}
                  className={`p-3 transition-colors ${
                    isCurrentUser ? 'bg-purple-900/20' : 'hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Player Info */}
                    <div className="flex items-center gap-3 flex-1">
                      {/* Rank/Status Icon */}
                      <div className={`text-xl ${status.color}`}>
                        {status.icon}
                      </div>

                      {/* Address */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-mono truncate ${isCurrentUser ? 'text-purple-400 font-bold' : 'text-gray-300'}`}>
                            {player.player.toString().slice(0, 4)}...
                            {player.player.toString().slice(-4)}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {status.label}
                        </div>
                      </div>
                    </div>

                    {/* Prediction Display */}
                    <div className="text-right">
                      <div className={`text-lg ${prediction.color}`}>
                        {prediction.icon}
                      </div>
                      <div className={`text-xs font-medium ${prediction.color}`}>
                        {prediction.text}
                      </div>
                    </div>
                  </div>

                  {/* Winnings (if completed) */}
                  {match.status === MatchStatus.Completed && player.winnings && Number(player.winnings) > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <div className="text-sm font-bold text-green-400">
                        +{Number(player.winnings).toFixed(2)} SOL
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}

            {/* Empty Slots */}
            {emptySlots > 0 && match.status === MatchStatus.Open && (
              <>
                {Array.from({ length: emptySlots }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="p-3 bg-gray-900/30"
                  >
                    <div className="flex items-center gap-3 opacity-50">
                      <div className="text-xl">⚫</div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 font-mono">
                          Empty Slot
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          Waiting for player...
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer Stats */}
      {players.length > 0 && (
        <div className="p-3 bg-gray-900/50 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Higher Pool:</span>
              <span className="ml-2 font-bold text-green-400">
                {Number(match.higherPool).toFixed(2)} SOL
              </span>
            </div>
            <div>
              <span className="text-gray-500">Lower Pool:</span>
              <span className="ml-2 font-bold text-red-400">
                {Number(match.lowerPool).toFixed(2)} SOL
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
