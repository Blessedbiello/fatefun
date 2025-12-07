'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function MatchList() {
  // TODO: Fetch from blockchain
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Matches</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Connect wallet to view active matches
        </p>
      </CardContent>
    </Card>
  )
}
