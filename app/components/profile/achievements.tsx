'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Achievements() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          No achievements unlocked
        </p>
      </CardContent>
    </Card>
  )
}
