'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Match } from '@/types/arena'
import { TrendingUp, TrendingDown, X, Check } from 'lucide-react'

interface PredictionPanelProps {
  match: Match
  disabled?: boolean
  onPredict?: (side: 'higher' | 'lower') => Promise<void>
}

export function PredictionPanel({ match, disabled = false, onPredict }: PredictionPanelProps) {
  const [selectedSide, setSelectedSide] = useState<'higher' | 'lower' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleSelect = (side: 'higher' | 'lower') => {
    if (disabled) return
    setSelectedSide(side)
    setShowConfirmation(true)
  }

  const handleConfirm = async () => {
    if (!selectedSide || !onPredict) return

    setIsSubmitting(true)
    try {
      await onPredict(selectedSide)
      setShowConfirmation(false)
      setSelectedSide(null)
    } catch (error) {
      console.error('Prediction failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmation(false)
    setSelectedSide(null)
  }

  const higherPoolPercentage = match.currentPlayers > 0
    ? (Number(match.higherPool) / (Number(match.higherPool) + Number(match.lowerPool))) * 100
    : 50

  const lowerPoolPercentage = 100 - higherPoolPercentage

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Make Your Prediction</h2>
        <p className="text-gray-400">
          {disabled
            ? 'Predictions are closed'
            : 'Will the price go higher or lower?'}
        </p>
      </div>

      {/* Prediction Buttons */}
      <div className="grid grid-cols-2 gap-6">
        {/* HIGHER Button */}
        <motion.button
          whileHover={!disabled ? { scale: 1.05, y: -8 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          onClick={() => handleSelect('higher')}
          disabled={disabled}
          className={`relative overflow-hidden rounded-2xl p-8 border-4 transition-all ${
            disabled
              ? 'border-gray-700 bg-gray-800 cursor-not-allowed opacity-50'
              : selectedSide === 'higher'
              ? 'border-green-500 bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg shadow-green-500/50'
              : 'border-green-500/30 bg-gradient-to-br from-green-900/30 to-emerald-900/30 hover:border-green-500'
          }`}
        >
          <div className="relative z-10 flex flex-col items-center gap-4">
            <motion.div
              animate={selectedSide === 'higher' ? { rotate: 360 } : {}}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center"
            >
              <TrendingUp size={40} className="text-white" />
            </motion.div>
            <div className="text-4xl font-bold text-white">HIGHER</div>
            <div className="text-sm text-gray-300">
              {higherPoolPercentage.toFixed(1)}% of pool
            </div>
            <div className="text-2xl font-bold text-green-400">
              {Number(match.higherPool).toFixed(2)} SOL
            </div>
          </div>

          {/* Animated background */}
          {selectedSide === 'higher' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400"
            />
          )}
        </motion.button>

        {/* LOWER Button */}
        <motion.button
          whileHover={!disabled ? { scale: 1.05, y: -8 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          onClick={() => handleSelect('lower')}
          disabled={disabled}
          className={`relative overflow-hidden rounded-2xl p-8 border-4 transition-all ${
            disabled
              ? 'border-gray-700 bg-gray-800 cursor-not-allowed opacity-50'
              : selectedSide === 'lower'
              ? 'border-red-500 bg-gradient-to-br from-red-600 to-rose-600 shadow-lg shadow-red-500/50'
              : 'border-red-500/30 bg-gradient-to-br from-red-900/30 to-rose-900/30 hover:border-red-500'
          }`}
        >
          <div className="relative z-10 flex flex-col items-center gap-4">
            <motion.div
              animate={selectedSide === 'lower' ? { rotate: 360 } : {}}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center"
            >
              <TrendingDown size={40} className="text-white" />
            </motion.div>
            <div className="text-4xl font-bold text-white">LOWER</div>
            <div className="text-sm text-gray-300">
              {lowerPoolPercentage.toFixed(1)}% of pool
            </div>
            <div className="text-2xl font-bold text-red-400">
              {Number(match.lowerPool).toFixed(2)} SOL
            </div>
          </div>

          {/* Animated background */}
          {selectedSide === 'lower' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-400"
            />
          )}
        </motion.button>
      </div>

      {/* Pool Distribution Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Higher: {higherPoolPercentage.toFixed(1)}%</span>
          <span>Lower: {lowerPoolPercentage.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${higherPoolPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500"
          />
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${lowerPoolPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-red-500 to-rose-500"
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="text-sm text-gray-300 text-center">
          Entry Fee: <span className="font-bold text-white">{Number(match.entryFee).toFixed(2)} SOL</span>
          {' • '}
          Winners split the losing pool proportionally
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-8 max-w-md w-full"
            >
              <div className="text-center space-y-6">
                <div className="text-6xl">
                  {selectedSide === 'higher' ? '📈' : '📉'}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Confirm Prediction
                  </h3>
                  <p className="text-gray-400">
                    You are predicting the price will go{' '}
                    <span className={`font-bold ${selectedSide === 'higher' ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedSide?.toUpperCase()}
                    </span>
                  </p>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Entry Fee</div>
                  <div className="text-2xl font-bold text-white">
                    {Number(match.entryFee).toFixed(2)} SOL
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <X size={20} className="inline mr-2" />
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50 ${
                      selectedSide === 'higher'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <>
                        <Check size={20} className="inline mr-2" />
                        Confirm
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
