'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PlayerStats() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Matches Played:</span>
          <span className="font-bold">0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Matches Won:</span>
          <span className="font-bold">0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Win Rate:</span>
          <span className="font-bold">0%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Winnings:</span>
          <span className="font-bold">0 SOL</span>
        </div>
      </CardContent>
    </Card>
  )
}
