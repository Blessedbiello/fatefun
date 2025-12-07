'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MatchHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Match History</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          No matches played yet
        </p>
      </CardContent>
    </Card>
  )
}
