'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ActiveMatches() {
  // This would fetch real matches from the blockchain
  const mockMatches = [
    { id: 1, asset: 'SOL/USD', players: 8, pool: '5.2 SOL', timeLeft: '3:45' },
    { id: 2, asset: 'BTC/USD', players: 6, pool: '12.8 SOL', timeLeft: '2:15' },
    { id: 3, asset: 'ETH/USD', players: 10, pool: '8.5 SOL', timeLeft: '4:20' },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-bold text-gradient">Active Matches</h2>
          <Link href="/arena">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockMatches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{match.asset}</span>
                  <span className="text-sm text-muted-foreground">
                    {match.timeLeft}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Players:</span>
                    <span className="font-semibold">{match.players}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prize Pool:</span>
                    <span className="font-semibold">{match.pool}</span>
                  </div>
                </div>
                <Link href={`/arena?match=${match.id}`}>
                  <Button className="w-full">Join Match</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
