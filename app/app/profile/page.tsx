'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { PlayerStats } from '@/components/profile/player-stats'
import { MatchHistory } from '@/components/profile/match-history'
import { Achievements } from '@/components/profile/achievements'
import { redirect } from 'next/navigation'

export default function ProfilePage() {
  const { publicKey } = useWallet()

  if (!publicKey) {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-gradient mb-8">Player Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PlayerStats />
          <div className="mt-8">
            <Achievements />
          </div>
        </div>
        <div className="lg:col-span-2">
          <MatchHistory />
        </div>
      </div>
    </div>
  )
}
