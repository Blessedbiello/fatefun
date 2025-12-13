'use client'

import { useState, useEffect } from 'react'
import { CreateMatchModal } from '@/components/arena/CreateMatchModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFateArenaProgram } from '@/hooks/useProgram'
import { fetchEnhancedMatches } from '@/lib/anchor/queries'
import { Match } from '@/types/arena'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getTimeUntilDeadline } from '@/lib/utils/matchTransform'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ArenaPage() {
  const program = useFateArenaProgram()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'inProgress' | 'completed'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function loadMatches() {
      if (!program) return

      try {
        setLoading(true)
        const allMatches = await fetchEnhancedMatches(program, 100)
        setMatches(allMatches)
      } catch (error) {
        console.error('Failed to load matches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()

    // Only set interval if modal is not open
    const interval = setInterval(() => {
      if (!isModalOpen) {
        loadMatches()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [program, isModalOpen])

  const filteredMatches = matches.filter((match) => {
    if (filter === 'all') return true
    if (filter === 'open') return match.status?.toString() === 'Open'
    if (filter === 'inProgress') return match.status?.toString() === 'InProgress'
    if (filter === 'completed') return match.status?.toString() === 'Completed'
    return true
  })

  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return 'Expired'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMatchCreated = (matchAddress: string) => {
    router.push(`/arena/${matchAddress}`)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Battle Arena</h1>
          <p className="text-muted-foreground mt-2">
            Join matches or create your own price prediction challenges
          </p>
        </div>
        <CreateMatchModal onMatchCreated={handleMatchCreated} onOpenChange={setIsModalOpen} />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Matches
        </Button>
        <Button
          variant={filter === 'open' ? 'default' : 'outline'}
          onClick={() => setFilter('open')}
        >
          Open
        </Button>
        <Button
          variant={filter === 'inProgress' ? 'default' : 'outline'}
          onClick={() => setFilter('inProgress')}
        >
          In Progress
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
      </div>

      {/* Match List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground mb-4">
              No {filter !== 'all' ? filter : ''} matches found
            </p>
            <CreateMatchModal onMatchCreated={handleMatchCreated} onOpenChange={setIsModalOpen} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <Card
              key={match.publicKey.toString()}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/arena/${match.publicKey.toString()}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{match.marketName || 'Unknown Market'}</CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      match.status?.toString() === 'Open'
                        ? 'bg-green-500/20 text-green-500'
                        : match.status?.toString() === 'InProgress'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {match.status?.toString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {match.matchType?.toString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Players:</span>
                  <span className="font-semibold">
                    {match.currentPlayers}/{match.maxPlayers}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prize Pool:</span>
                  <span className="font-semibold">
                    {(Number(match.prizePool) / LAMPORTS_PER_SOL).toFixed(2)} SOL
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entry Fee:</span>
                  <span>{(Number(match.entryFee) / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
                </div>
                {match.status?.toString() === 'Open' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time Left:</span>
                    <span className="font-mono">
                      {formatTimeLeft(getTimeUntilDeadline(match))}
                    </span>
                  </div>
                )}
                <Button className="w-full mt-2" size="sm">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
