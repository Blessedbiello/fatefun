import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PublicKey } from '@solana/web3.js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string | PublicKey, chars = 4): string {
  const addressStr = typeof address === 'string' ? address : address.toBase58()
  return `${addressStr.slice(0, chars)}...${addressStr.slice(-chars)}`
}

export function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(4) + ' SOL'
}

export function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

export function formatPercentage(value: number): string {
  return value.toFixed(2) + '%'
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function getTimeRemaining(endTime: number): string {
  const now = Date.now() / 1000
  const remaining = Math.max(0, endTime - now)

  if (remaining === 0) return 'Ended'

  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function getPriceColor(change: number): string {
  if (change > 0) return 'text-green-500'
  if (change < 0) return 'text-red-500'
  return 'text-gray-500'
}

export function getPriceIcon(change: number): string {
  if (change > 0) return '↑'
  if (change < 0) return '↓'
  return '='
}
