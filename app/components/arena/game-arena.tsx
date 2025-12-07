'use client'

import { Card, CardContent } from '@/components/ui/card'

export function GameArena() {
  return (
    <Card className="h-[600px]">
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-2xl font-bold mb-2">Game Arena</h3>
          <p className="text-muted-foreground">
            Moddio game engine integration will appear here
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
