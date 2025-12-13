'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useFateArenaProgram } from '@/hooks/useProgram'
import { useMatchTransactions } from '@/hooks/useMatchTransactions'
import { fetchEnhancedMatches } from '@/lib/anchor/queries'
import { Match, MatchStatus } from '@/types/arena'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { getTimeUntilDeadline, formatMatchType } from '@/lib/utils/matchTransform'
import { Loader2, Swords, Trophy, Clock } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useToast } from '@/components/ui/use-toast'

export function ActiveMatches() {
  const program = useFateArenaProgram()
  const { publicKey } = useWallet()
  const { joinMatch, loading: joiningMatch } = useMatchTransactions()
  const { toast } = useToast()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null)

  useEffect(() => {
    async function loadMatches() {
      if (!program) return

      try {
        setLoading(true)
        const allMatches = await fetchEnhancedMatches(program, 100)

        // Filter for open matches only and take first 3
        const openMatches = allMatches
          .filter(m => m.status?.toString() === 'Open')
          .slice(0, 3)

        setMatches(openMatches)
      } catch (error) {
        console.error('Failed to load matches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
    // Refresh every 30 seconds
    const interval = setInterval(loadMatches, 30000)
    return () => clearInterval(interval)
  }, [program])

  // Helper to format countdown
  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return 'Expired'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle join match
  const handleJoinMatch = async (matchAddress: string) => {
    if (!publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to join a match',
        variant: 'destructive',
      })
      return
    }

    try {
      setJoiningMatchId(matchAddress)
      await joinMatch(new PublicKey(matchAddress))

      toast({
        title: 'Successfully Joined!',
        description: 'You have joined the match',
      })

      // Refresh matches after a delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      toast({
        title: 'Failed to Join Match',
        description: error.message || 'Unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setJoiningMatchId(null)
    }
  }

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-5xl md:text-6xl font-black">
            <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              ACTIVE BATTLES
            </span>
          </h2>
          <Link href="/arena">
            <Button variant="outline" className="border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white transition-all">
              View All Matches
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-6 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-6">
              <Swords className="w-16 h-16 text-purple-400" />
            </div>
            <p className="text-xl text-gray-400 mb-6">No active battles at the moment</p>
            <Link href="/arena">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6">
                Create Your First Match
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Card
                key={match.publicKey.toString()}
                className="group relative overflow-hidden border-2 border-gray-800 hover:border-purple-500 transition-all bg-gray-900/50 backdrop-blur-sm hover:scale-105 transform hover:shadow-2xl hover:shadow-purple-500/20"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <CardHeader className="relative z-10">
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-bold">{match.marketName || 'Unknown Market'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-mono">
                        {formatTimeLeft(getTimeUntilDeadline(match))}
                      </span>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50 text-xs font-semibold text-purple-300">
                      {formatMatchType(match.matchType)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Players:
                      </span>
                      <span className="font-bold text-white">{match.currentPlayers}/{match.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-purple-900/30 to-pink-900/30">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        Prize Pool:
                      </span>
                      <span className="font-bold text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">
                        {(Number(match.prizePool) / LAMPORTS_PER_SOL).toFixed(2)} SOL
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50">
                      <span className="text-gray-400">Entry Fee:</span>
                      <span className="text-white font-semibold">
                        {(Number(match.entryFee) / LAMPORTS_PER_SOL).toFixed(2)} SOL
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/arena/${match.publicKey.toString()}`} className="flex-1">
                      <Button variant="outline" className="w-full border-2 border-gray-700 hover:border-purple-500 text-gray-300 hover:text-white transition-all">
                        Details
                      </Button>
                    </Link>
                    <Button
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 transition-all"
                      disabled={match.currentPlayers >= match.maxPlayers || joiningMatchId === match.publicKey.toString()}
                      onClick={() => handleJoinMatch(match.publicKey.toString())}
                    >
                      {joiningMatchId === match.publicKey.toString() ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : match.currentPlayers >= match.maxPlayers ? (
                        'Full'
                      ) : (
                        <>
                          <Swords className="mr-2 h-4 w-4" />
                          Join Battle
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
