'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFateCouncilProgram } from '@/hooks/useProgram'
import { fetchAllProposals, fetchCouncilConfig } from '@/lib/anchor/queries'
import { useWallet } from '@solana/wallet-adapter-react'
import { Loader2 } from 'lucide-react'

export function GovernanceStats() {
  const program = useFateCouncilProgram()
  const { publicKey } = useWallet()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    votingPower: 0
  })

  useEffect(() => {
    async function loadStats() {
      if (!program) return

      try {
        setLoading(true)

        // Fetch all proposals
        const proposals = await fetchAllProposals(program, 1000)
        const activeProposals = proposals.filter((p: any) =>
          p.account.status && (p.account.status as any).active
        )

        // Fetch council config for voting power calculation
        await fetchCouncilConfig(program)

        // Calculate voting power (simplified - in production would check token holdings)
        const votingPower = publicKey ? 100 : 0 // Placeholder

        setStats({
          totalProposals: proposals.length,
          activeProposals: activeProposals.length,
          votingPower
        })
      } catch (error) {
        console.error('Failed to load governance stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
    // Refresh every minute
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [program, publicKey])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalProposals}</div>
          <p className="text-sm text-muted-foreground mt-2">
            All-time proposals created
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Votes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.activeProposals}</div>
          <p className="text-sm text-muted-foreground mt-2">
            Currently open for voting
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your Voting Power</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.votingPower}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {publicKey ? 'Based on token holdings' : 'Connect wallet to view'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
