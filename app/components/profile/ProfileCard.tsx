'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PublicKey } from '@solana/web3.js'
import { getTierColor, getTierIcon, getLevelTier } from '@/types/profile'
import { TrendingUp } from 'lucide-react'

interface ProfileCardProps {
  publicKey: PublicKey
  username?: string
  level: number
  wins: number
  totalMatches: number
  clickable?: boolean
}

export function ProfileCard({
  publicKey,
  username,
  level,
  wins,
  totalMatches,
  clickable = true,
}: ProfileCardProps) {
  const router = useRouter()
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0
  const tier = getLevelTier(level)
  const tierColor = getTierColor(tier)
  const tierIcon = getTierIcon(tier)

  // Generate avatar from address
  const avatarGradient = `from-${['purple', 'blue', 'pink', 'green', 'yellow'][publicKey.toBuffer()[0] % 5]}-500 to-${['cyan', 'violet', 'rose', 'emerald', 'orange'][publicKey.toBuffer()[1] % 5]}-500`

  const handleClick = () => {
    if (clickable) {
      router.push(`/profile/${publicKey.toString()}`)
    }
  }

  return (
    <motion.div
      whileHover={clickable ? { scale: 1.02 } : {}}
      whileTap={clickable ? { scale: 0.98 } : {}}
      onClick={handleClick}
      className={`flex items-center gap-3 ${clickable ? 'cursor-pointer' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
        {username ? username.charAt(0).toUpperCase() : publicKey.toString().slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium text-white truncate">
            {username || `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`}
          </div>
          <div className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${tierColor} text-xs font-bold text-white flex items-center gap-1`}>
            <span className="text-sm">{tierIcon}</span>
            <span>{level}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <TrendingUp size={14} className={winRate >= 50 ? 'text-green-400' : 'text-red-400'} />
            <span className={winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
              {winRate.toFixed(1)}%
            </span>
          </div>
          <div>
            {wins}W / {totalMatches - wins}L
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Compact version for leaderboard rows
export function ProfileCardCompact({
  publicKey,
  username,
  level,
  clickable = true,
}: {
  publicKey: PublicKey
  username?: string
  level: number
  clickable?: boolean
}) {
  const router = useRouter()
  const tier = getLevelTier(level)
  const tierColor = getTierColor(tier)
  const tierIcon = getTierIcon(tier)

  const avatarGradient = `from-${['purple', 'blue', 'pink', 'green', 'yellow'][publicKey.toBuffer()[0] % 5]}-500 to-${['cyan', 'violet', 'rose', 'emerald', 'orange'][publicKey.toBuffer()[1] % 5]}-500`

  const handleClick = () => {
    if (clickable) {
      router.push(`/profile/${publicKey.toString()}`)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2 ${clickable ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
        {username ? username.charAt(0).toUpperCase() : publicKey.toString().slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {username || `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`}
        </div>
      </div>

      <div className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${tierColor} text-xs font-bold text-white flex items-center gap-1`}>
        <span>{tierIcon}</span>
        <span>{level}</span>
      </div>
    </div>
  )
}
