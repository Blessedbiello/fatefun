'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GovernanceStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">0</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">0</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your Voting Power</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">0</div>
        </CardContent>
      </Card>
    </div>
  )
}
