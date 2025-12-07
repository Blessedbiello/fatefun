'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { UserProfile as UserProfileType, MatchHistory, getTierColor, getTierIcon, getLevelTier } from '@/types/profile'
import { LevelSystem } from './LevelSystem'
import { EditProfileModal } from './EditProfileModal'
import { Copy, Edit, Calendar, TrendingUp, TrendingDown, DollarSign, Trophy, Zap, Award } from 'lucide-react'

interface UserProfileProps {
  profile: UserProfileType
  matchHistory: MatchHistory[]
  isOwnProfile: boolean
  onUpdateUsername?: (username: string) => Promise<void>
}

export function UserProfile({ profile, matchHistory, isOwnProfile, onUpdateUsername }: UserProfileProps) {
  const router = useRouter()
  const { publicKey } = useWallet()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  const winRate = profile.totalMatches > 0 ? (profile.wins / profile.totalMatches) * 100 : 0
  const netPnL = Number(profile.totalWon) - Number(profile.totalWagered)
  const tier = getLevelTier(profile.level)
  const tierColor = getTierColor(tier)
  const tierIcon = getTierIcon(tier)

  // Generate avatar gradient
  const avatarGradient = `from-${['purple', 'blue', 'pink', 'green', 'yellow'][profile.publicKey.toBuffer()[0] % 5]}-500 to-${['cyan', 'violet', 'rose', 'emerald', 'orange'][profile.publicKey.toBuffer()[1] % 5]}-500`

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(profile.publicKey.toString())
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-5xl font-bold shadow-2xl flex-shrink-0`}>
            {profile.username ? profile.username.charAt(0).toUpperCase() : profile.publicKey.toString().slice(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            {/* Username/Address */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">
                  {profile.username || 'Anonymous'}
                </h1>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit profile"
                  >
                    <Edit size={20} className="text-gray-400" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-400">
                  {profile.publicKey.toString().slice(0, 8)}...{profile.publicKey.toString().slice(-8)}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <span className="text-green-400 text-xs">Copied!</span>
                  ) : (
                    <Copy size={14} className="text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Level Badge & Member Since */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${tierColor} flex items-center gap-2`}>
                  <span className="text-2xl">{tierIcon}</span>
                  <div>
                    <div className="text-xs text-white/80">Level</div>
                    <div className="text-xl font-bold text-white">{profile.level}</div>
                  </div>
                </div>
                <div className={`text-lg font-bold bg-gradient-to-r ${tierColor} bg-clip-text text-transparent`}>
                  {tier}
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={16} />
                <span className="text-sm">
                  Member since {new Date(Number(profile.createdAt) * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* XP Progress (compact) */}
            <div className="max-w-md">
              <LevelSystem totalXP={profile.xp} compact />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-gray-500" />
            <div className="text-xs text-gray-500">Matches Played</div>
          </div>
          <div className="text-3xl font-bold text-white">{profile.totalMatches}</div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className={winRate >= 50 ? 'text-green-500' : 'text-red-500'} />
            <div className="text-xs text-gray-500">Win Rate</div>
          </div>
          <div className={`text-3xl font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {profile.wins}W / {profile.losses}L
          </div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-yellow-500" />
            <div className="text-xs text-gray-500">Total Wagered</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {(Number(profile.totalWagered) / 1e9).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">SOL</div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-green-500" />
            <div className="text-xs text-gray-500">Total Won</div>
          </div>
          <div className="text-3xl font-bold text-green-400">
            {(Number(profile.totalWon) / 1e9).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">SOL</div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className={netPnL >= 0 ? 'text-green-500' : 'text-red-500'} />
            <div className="text-xs text-gray-500">Net P&L</div>
          </div>
          <div className={`text-3xl font-bold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netPnL >= 0 ? '+' : ''}{(netPnL / 1e9).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">SOL</div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-yellow-500" />
            <div className="text-xs text-gray-500">Current Streak</div>
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {profile.currentStreak}
          </div>
          <div className="text-xs text-gray-500 mt-1">wins</div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-purple-500" />
            <div className="text-xs text-gray-500">Best Streak</div>
          </div>
          <div className="text-3xl font-bold text-purple-400">
            {profile.bestStreak}
          </div>
          <div className="text-xs text-gray-500 mt-1">wins</div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-blue-500" />
            <div className="text-xs text-gray-500">Achievements</div>
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {profile.achievements.filter((a) => a.unlockedAt).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            / {profile.achievements.length}
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Matches</h2>

        {matchHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🎮</div>
            <p className="text-gray-400">No matches played yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchHistory.slice(0, 10).map((match, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.01 }}
                onClick={() => router.push(`/arena/${match.matchId}`)}
                className="p-4 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium text-white">{match.marketName}</div>
                      <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                        match.prediction === 'Higher' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {match.prediction === 'Higher' ? '📈 HIGHER' : '📉 LOWER'}
                      </div>
                      <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                        match.result === 'Win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {match.result === 'Win' ? '✓ WIN' : '✗ LOSS'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Wagered: {(Number(match.amountWagered) / 1e9).toFixed(2)} SOL</span>
                      <span className={match.result === 'Win' ? 'text-green-400' : 'text-red-400'}>
                        {match.result === 'Win' ? '+' : ''}{(Number(match.profit) / 1e9).toFixed(2)} SOL
                      </span>
                      <span>{new Date(Number(match.playedAt) * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {match.result === 'Win' ? (
                    <TrendingUp size={24} className="text-green-400" />
                  ) : (
                    <TrendingDown size={24} className="text-red-400" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      {profile.achievements.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Achievements</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 ${
                  achievement.unlockedAt
                    ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500'
                    : 'bg-gray-900 border-gray-700 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="font-bold text-white text-sm mb-1">{achievement.title}</div>
                <div className="text-xs text-gray-400">{achievement.description}</div>
                {achievement.unlockedAt && (
                  <div className="text-xs text-purple-400 mt-2">
                    {new Date(Number(achievement.unlockedAt) * 1000).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isOwnProfile && onUpdateUsername && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentUsername={profile.username}
          onSave={onUpdateUsername}
        />
      )}
    </div>
  )
}
