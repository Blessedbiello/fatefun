'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useFateArenaProgram } from '@/hooks/useProgram'
import { useMatchTransactions } from '@/hooks/useMatchTransactions'
import { fetchEnhancedMatch, fetchPlayersInMatch } from '@/lib/anchor/queries'
import { Match, PlayerEntry, PredictionSide } from '@/types/arena'
import { MARKETS } from '@/lib/anchor/setup'
import {
  getTimeUntilDeadline,
  getTimeUntilResolution,
  canSubmitPrediction,
  canResolveMatch,
  calculatePotentialWinnings,
  formatMatchStatus,
  formatMatchType,
  formatPredictionSide,
} from '@/lib/utils/matchTransform'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWallet } from '@solana/wallet-adapter-react'
import { Loader2, TrendingUp, TrendingDown, Trophy, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { publicKey } = useWallet()
  const program = useFateArenaProgram()
  const { submitPrediction, resolveMatch, claimWinnings, loading } = useMatchTransactions()
  const { toast } = useToast()

  const [match, setMatch] = useState<Match | null>(null)
  const [playerEntry, setPlayerEntry] = useState<any | null>(null)
  const [loadingMatch, setLoadingMatch] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)

  const matchAddress = params.matchId as string

  // Load match data
  useEffect(() => {
    async function loadMatch() {
      if (!program || !matchAddress) return

      try {
        setLoadingMatch(true)
        const matchData = await fetchEnhancedMatch(program, new PublicKey(matchAddress))
        setMatch(matchData)

        // Load player entry if wallet connected
        if (publicKey && matchData) {
          const players = await fetchPlayersInMatch(program, new PublicKey(matchAddress))
          const myEntry = players.find((p: any) => p.account.player.equals(publicKey))
          setPlayerEntry(myEntry?.account || null)
        }
      } catch (error) {
        console.error('Failed to load match:', error)
      } finally {
        setLoadingMatch(false)
      }
    }

    loadMatch()
    // Refresh every 10 seconds
    const interval = setInterval(loadMatch, 10000)
    return () => clearInterval(interval)
  }, [program, matchAddress, publicKey])

  // Update countdown timer
  useEffect(() => {
    if (!match) return

    const updateTimer = () => {
      if (match.status?.toString() === 'Open') {
        setTimeLeft(getTimeUntilDeadline(match))
      } else if (match.status?.toString() === 'InProgress') {
        setTimeLeft(getTimeUntilResolution(match))
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [match])

  const handlePrediction = async (direction: 'higher' | 'lower') => {
    if (!match) return

    try {
      // Find the Pyth price feed for this market
      const marketKey = Object.keys(MARKETS).find(
        (key) => MARKETS[key as keyof typeof MARKETS].toString() === match.market.toString()
      )

      if (!marketKey) {
        throw new Error('Market not found')
      }

      // Get Pyth feed from env
      const pythFeedKey = `NEXT_PUBLIC_MARKET_${marketKey.replace('_', '_')}`
      const pythFeed = process.env[pythFeedKey]

      if (!pythFeed) {
        throw new Error('Pyth price feed not configured')
      }

      await submitPrediction({
        matchAddress: new PublicKey(matchAddress),
        marketAddress: match.market,
        pythPriceFeed: new PublicKey(pythFeed),
        prediction: direction,
      })

      toast({
        title: 'Prediction Submitted!',
        description: `You predicted ${direction.toUpperCase()}`,
      })

      // Refresh match data
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      toast({
        title: 'Failed to Submit Prediction',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleResolve = async () => {
    if (!match) return

    try {
      const marketKey = Object.keys(MARKETS).find(
        (key) => MARKETS[key as keyof typeof MARKETS].toString() === match.market.toString()
      )

      if (!marketKey) throw new Error('Market not found')

      const pythFeedKey = `NEXT_PUBLIC_MARKET_${marketKey.replace('_', '_')}`
      const pythFeed = process.env[pythFeedKey]

      if (!pythFeed) throw new Error('Pyth price feed not configured')

      await resolveMatch({
        matchAddress: new PublicKey(matchAddress),
        marketAddress: match.market,
        pythPriceFeed: new PublicKey(pythFeed),
      })

      toast({
        title: 'Match Resolved!',
        description: 'The match has been finalized',
      })

      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      toast({
        title: 'Failed to Resolve Match',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleClaim = async () => {
    try {
      await claimWinnings(new PublicKey(matchAddress))

      toast({
        title: 'Winnings Claimed!',
        description: 'Your winnings have been transferred to your wallet',
      })

      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      toast({
        title: 'Failed to Claim Winnings',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Expired'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loadingMatch) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">Match not found</p>
            <Button onClick={() => router.push('/arena')}>Back to Arena</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasJoined = !!playerEntry
  const hasPredicted = playerEntry?.prediction !== null
  const canPredict = hasJoined && !hasPredicted && canSubmitPrediction(match)
  const matchCompleted = match.status?.toString() === 'Completed'
  const isWinner = matchCompleted && playerEntry?.prediction === match.winningSide
  const canClaim = matchCompleted && isWinner && !playerEntry?.claimed

  return (
    <div className="container mx-auto px-4 py-10">
      <Button variant="outline" onClick={() => router.push('/arena')} className="mb-6">
        ← Back to Arena
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Match Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{match.marketName || 'Unknown Market'}</CardTitle>
              <p className="text-muted-foreground">Match ID: {match.matchId.toString()}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold">{formatMatchStatus(match.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Players</p>
                  <p className="font-semibold">{match.currentPlayers}/{match.maxPlayers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <p className="font-semibold">{(Number(match.prizePool) / LAMPORTS_PER_SOL).toFixed(2)} SOL</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entry Fee</p>
                  <p className="font-semibold">{(Number(match.entryFee) / LAMPORTS_PER_SOL).toFixed(2)} SOL</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Countdown Timer */}
          {!matchCompleted && (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">
                      {match.status?.toString() === 'Open' ? 'Prediction Deadline' : 'Time Until Resolution'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prediction Buttons */}
          {canPredict && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className="h-24 bg-green-600 hover:bg-green-700"
                    onClick={() => handlePrediction('higher')}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <TrendingUp className="w-8 h-8 mr-2" />
                        <span className="text-xl">HIGHER</span>
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    className="h-24 bg-red-600 hover:bg-red-700"
                    onClick={() => handlePrediction('lower')}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <TrendingDown className="w-8 h-8 mr-2" />
                        <span className="text-xl">LOWER</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player Status */}
          {hasJoined && (
            <Card>
              <CardHeader>
                <CardTitle>Your Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stake:</span>
                  <span className="font-semibold">
                    {(Number(playerEntry.amountStaked) / LAMPORTS_PER_SOL).toFixed(2)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prediction:</span>
                  <span className="font-semibold">
                    {playerEntry.prediction ? formatPredictionSide(playerEntry.prediction) : 'Not submitted'}
                  </span>
                </div>
                {matchCompleted && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Result:</span>
                      <span className={`font-semibold ${isWinner ? 'text-green-500' : 'text-red-500'}`}>
                        {isWinner ? 'WON' : 'LOST'}
                      </span>
                    </div>
                    {isWinner && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Winnings:</span>
                        <span className="font-semibold text-green-500">
                          {(Number(playerEntry.winnings) / LAMPORTS_PER_SOL).toFixed(2)} SOL
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Claim Winnings */}
          {canClaim && (
            <Card className="border-green-500">
              <CardContent className="py-6">
                <Button
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleClaim}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Trophy className="mr-2 h-5 w-5" />
                  )}
                  Claim {(Number(playerEntry.winnings) / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Resolve Match Button */}
          {canResolveMatch(match) && (
            <Card>
              <CardContent className="py-6">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={handleResolve}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    'Resolve Match'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Anyone can resolve the match after the resolution time
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pool Distribution */}
          {match.higherPool !== undefined && match.lowerPool !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Pool Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-green-500">HIGHER</span>
                    <span className="text-sm">
                      {(Number(match.higherPool) / LAMPORTS_PER_SOL).toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{
                        width: `${(Number(match.higherPool) / Number(match.prizePool)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-red-500">LOWER</span>
                    <span className="text-sm">
                      {(Number(match.lowerPool) / LAMPORTS_PER_SOL).toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600"
                      style={{
                        width: `${(Number(match.lowerPool) / Number(match.prizePool)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Match Details */}
          <Card>
            <CardHeader>
              <CardTitle>Match Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span>{formatMatchType(match.matchType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(Number(match.createdAt) * 1000).toLocaleString()}</span>
              </div>
              {match.startedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span>{new Date(Number(match.startedAt) * 1000).toLocaleString()}</span>
                </div>
              )}
              {match.startPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Price:</span>
                  <span>${Number(match.startPrice).toFixed(2)}</span>
                </div>
              )}
              {match.endPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Price:</span>
                  <span>${Number(match.endPrice).toFixed(2)}</span>
                </div>
              )}
              {match.winningSide && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Winner:</span>
                  <span className="font-semibold">{formatPredictionSide(match.winningSide)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
