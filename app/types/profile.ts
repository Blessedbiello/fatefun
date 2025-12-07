import { PublicKey } from '@solana/web3.js'

export interface UserProfile {
  publicKey: PublicKey
  username?: string
  level: number
  xp: number
  totalMatches: number
  wins: number
  losses: number
  totalWagered: bigint
  totalWon: bigint
  currentStreak: number
  bestStreak: number
  createdAt: bigint
  lastActiveAt: bigint
  achievements: Achievement[]
}

export interface MatchHistory {
  matchId: bigint
  marketName: string
  prediction: 'Higher' | 'Lower'
  result: 'Win' | 'Loss'
  amountWagered: bigint
  amountWon: bigint
  profit: bigint
  playedAt: bigint
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: bigint
}

export interface LeaderboardEntry {
  rank: number
  previousRank?: number
  player: PublicKey
  username?: string
  level: number
  wins: number
  totalMatches: number
  winRate: number
  totalWon: bigint
  currentStreak: number
  netPnL: bigint
}

export enum LeaderboardPeriod {
  AllTime = 'allTime',
  Week = 'week',
  Day = 'day',
}

export enum LevelTier {
  Novice = 'Novice',
  Apprentice = 'Apprentice',
  Predictor = 'Predictor',
  Oracle = 'Oracle',
  Sage = 'Sage',
  Legend = 'Legend',
  Mythic = 'Mythic',
}

export interface LevelInfo {
  level: number
  tier: LevelTier
  currentXP: number
  xpForNextLevel: number
  progress: number // 0-100
  benefits: string[]
}

// XP System
export const XP_REWARDS = {
  WIN_BASE: 100,
  LOSS_PARTICIPATION: 25,
  STREAK_BONUS_PER_LEVEL: 10,
}

export const calculateXPForLevel = (level: number): number => {
  return level * 500
}

export const calculateLevel = (totalXP: number): number => {
  let level = 1
  let xpRequired = calculateXPForLevel(level)
  let accumulatedXP = 0

  while (accumulatedXP + xpRequired <= totalXP) {
    accumulatedXP += xpRequired
    level++
    xpRequired = calculateXPForLevel(level)
  }

  return level
}

export const getLevelTier = (level: number): LevelTier => {
  if (level >= 100) return LevelTier.Mythic
  if (level >= 76) return LevelTier.Legend
  if (level >= 51) return LevelTier.Sage
  if (level >= 31) return LevelTier.Oracle
  if (level >= 16) return LevelTier.Predictor
  if (level >= 6) return LevelTier.Apprentice
  return LevelTier.Novice
}

export const getLevelInfo = (totalXP: number): LevelInfo => {
  const level = calculateLevel(totalXP)
  const tier = getLevelTier(level)

  // Calculate XP accumulated up to current level
  let accumulatedXP = 0
  for (let i = 1; i < level; i++) {
    accumulatedXP += calculateXPForLevel(i)
  }

  const currentLevelXP = totalXP - accumulatedXP
  const xpForNextLevel = calculateXPForLevel(level)
  const progress = (currentLevelXP / xpForNextLevel) * 100

  const benefits = getLevelBenefits(level)

  return {
    level,
    tier,
    currentXP: currentLevelXP,
    xpForNextLevel,
    progress,
    benefits,
  }
}

export const getLevelBenefits = (level: number): string[] => {
  const benefits: string[] = []

  if (level >= 10) benefits.push('Early access to new markets')
  if (level >= 20) benefits.push('5% fee discount')
  if (level >= 30) benefits.push('Exclusive tournaments')
  if (level >= 40) benefits.push('10% fee discount')
  if (level >= 50) benefits.push('VIP support')
  if (level >= 60) benefits.push('15% fee discount')
  if (level >= 75) benefits.push('Governance voting rights')
  if (level >= 100) benefits.push('Mythic rewards & airdrops')

  return benefits
}

export const getTierColor = (tier: LevelTier): string => {
  const colors = {
    [LevelTier.Novice]: 'from-gray-500 to-gray-600',
    [LevelTier.Apprentice]: 'from-green-500 to-emerald-600',
    [LevelTier.Predictor]: 'from-blue-500 to-cyan-600',
    [LevelTier.Oracle]: 'from-purple-500 to-violet-600',
    [LevelTier.Sage]: 'from-yellow-500 to-orange-600',
    [LevelTier.Legend]: 'from-red-500 to-rose-600',
    [LevelTier.Mythic]: 'from-pink-500 via-purple-500 to-indigo-600',
  }
  return colors[tier]
}

export const getTierIcon = (tier: LevelTier): string => {
  const icons = {
    [LevelTier.Novice]: '🌱',
    [LevelTier.Apprentice]: '⚔️',
    [LevelTier.Predictor]: '🎯',
    [LevelTier.Oracle]: '🔮',
    [LevelTier.Sage]: '🧙',
    [LevelTier.Legend]: '👑',
    [LevelTier.Mythic]: '⚡',
  }
  return icons[tier]
}

// Built-in achievements
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    title: 'First Blood',
    description: 'Win your first match',
    icon: '🎉',
  },
  {
    id: 'streak_5',
    title: 'Hot Streak',
    description: 'Win 5 matches in a row',
    icon: '🔥',
  },
  {
    id: 'streak_10',
    title: 'Unstoppable',
    description: 'Win 10 matches in a row',
    icon: '⚡',
  },
  {
    id: 'whale',
    title: 'Whale',
    description: 'Wager 100+ SOL in total',
    icon: '🐋',
  },
  {
    id: 'grinder',
    title: 'Grinder',
    description: 'Play 100 matches',
    icon: '💪',
  },
  {
    id: 'profit_king',
    title: 'Profit King',
    description: 'Win 50+ SOL in total',
    icon: '💰',
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Win 7 days in a row',
    icon: '🏆',
  },
  {
    id: 'oracle_rank',
    title: 'True Oracle',
    description: 'Reach Oracle tier',
    icon: '🔮',
  },
]
