'use client'

import { MatchList } from '@/components/arena/match-list'
import { CreateMatch } from '@/components/arena/create-match'
import { GameArena } from '@/components/arena/game-arena'

export default function ArenaPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gradient">Battle Arena</h1>
        <CreateMatch />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <GameArena />
        </div>
        <div className="lg:col-span-1">
          <MatchList />
        </div>
      </div>
    </div>
  )
}
