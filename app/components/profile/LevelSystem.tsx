'use client'

import { motion } from 'framer-motion'
import { getLevelInfo, getTierColor, getTierIcon } from '@/types/profile'
import { Trophy, Star, Zap } from 'lucide-react'

interface LevelSystemProps {
  totalXP: number
  compact?: boolean
}

export function LevelSystem({ totalXP, compact = false }: LevelSystemProps) {
  const levelInfo = getLevelInfo(totalXP)
  const tierColor = getTierColor(levelInfo.tier)
  const tierIcon = getTierIcon(levelInfo.tier)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${tierColor} flex items-center gap-1`}>
          <span className="text-lg">{tierIcon}</span>
          <span className="text-sm font-bold text-white">Lv {levelInfo.level}</span>
        </div>
        <div className="text-sm text-gray-400">{levelInfo.tier}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tierColor} flex items-center justify-center text-3xl shadow-lg`}>
            {tierIcon}
          </div>
          <div>
            <div className="text-2xl font-bold text-white">Level {levelInfo.level}</div>
            <div className={`text-lg font-medium bg-gradient-to-r ${tierColor} bg-clip-text text-transparent`}>
              {levelInfo.tier}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Total XP</div>
          <div className="text-xl font-bold text-white">{totalXP.toLocaleString()}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            {levelInfo.currentXP.toLocaleString()} / {levelInfo.xpForNextLevel.toLocaleString()} XP
          </span>
          <span className="text-purple-400 font-medium">
            {levelInfo.progress.toFixed(1)}%
          </span>
        </div>

        <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${tierColor} relative`}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </motion.div>
        </div>

        <div className="text-xs text-center text-gray-500">
          {levelInfo.xpForNextLevel - levelInfo.currentXP} XP to Level {levelInfo.level + 1}
        </div>
      </div>

      {/* Benefits */}
      {levelInfo.benefits.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white">Level Benefits</h3>
          </div>
          <ul className="space-y-1">
            {levelInfo.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-purple-400">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* XP Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={14} className="text-green-400" />
            <div className="text-xs text-gray-500">Win</div>
          </div>
          <div className="text-lg font-bold text-green-400">+100 XP</div>
        </div>

        <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-yellow-400" />
            <div className="text-xs text-gray-500">Streak</div>
          </div>
          <div className="text-lg font-bold text-yellow-400">+10 XP/lvl</div>
        </div>

        <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} className="text-gray-400" />
            <div className="text-xs text-gray-500">Loss</div>
          </div>
          <div className="text-lg font-bold text-gray-400">+25 XP</div>
        </div>
      </div>

      {/* Level Tiers */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h3 className="text-sm font-bold text-white mb-3">Level Tiers</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span>🌱</span>
            <span className="text-gray-400">Lv 1-5: Novice</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚔️</span>
            <span className="text-gray-400">Lv 6-15: Apprentice</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span className="text-gray-400">Lv 16-30: Predictor</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔮</span>
            <span className="text-gray-400">Lv 31-50: Oracle</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🧙</span>
            <span className="text-gray-400">Lv 51-75: Sage</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👑</span>
            <span className="text-gray-400">Lv 76-99: Legend</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <span>⚡</span>
            <span className="text-gray-400">Lv 100+: Mythic</span>
          </div>
        </div>
      </div>
    </div>
  )
}
