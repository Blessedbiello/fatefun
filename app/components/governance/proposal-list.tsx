'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProposalList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Proposals</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          No active proposals
        </p>
      </CardContent>
    </Card>
  )
}
