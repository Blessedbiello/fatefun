'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useEffect, useState } from 'react'
import { useFateArenaProgram } from '@/hooks/useProgram'
import { fetchArenaConfig, fetchMarkets, fetchAllMatches } from '@/lib/anchor/queries'
import { ARENA_CONFIG, MARKETS } from '@/lib/anchor/setup'

export default function TestPage() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const program = useFateArenaProgram()

  const [config, setConfig] = useState<any>(null)
  const [markets, setMarkets] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    if (!program) {
      setError('Program not loaded - please connect your wallet')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Loading arena config...')
      const configData = await fetchArenaConfig(program)
      console.log('Config:', configData)
      setConfig(configData)

      console.log('Loading markets...')
      const marketsData = await fetchMarkets(program)
      console.log('Markets:', marketsData)
      setMarkets(marketsData)

      console.log('Loading matches...')
      const matchesData = await fetchAllMatches(program, 10)
      console.log('Matches:', matchesData)
      setMatches(matchesData)

    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">FATE Protocol Integration Test</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Wallet Connection</h2>
        <WalletMultiButton />
        <div className="mt-4 space-y-2">
          <p><strong>Wallet Connected:</strong> {wallet.connected ? 'Yes' : 'No'}</p>
          {wallet.publicKey && (
            <p><strong>Address:</strong> {wallet.publicKey.toBase58()}</p>
          )}
          <p><strong>Program Loaded:</strong> {program ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Connection Info</h2>
        <div className="bg-gray-100 p-4 rounded space-y-2">
          <p><strong>RPC Endpoint:</strong> {process.env.NEXT_PUBLIC_RPC_ENDPOINT}</p>
          <p><strong>Network:</strong> {process.env.NEXT_PUBLIC_SOLANA_NETWORK}</p>
          <p><strong>Arena Program:</strong> {process.env.NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID}</p>
          <p><strong>Council Program:</strong> {process.env.NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID}</p>
        </div>
      </div>

      <div className="mb-8">
        <button
          onClick={loadData}
          disabled={!program || loading}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Load Protocol Data'}
        </button>
      </div>

      {error && (
        <div className="mb-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {config && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Arena Config</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Address:</strong> {ARENA_CONFIG.toBase58()}</p>
            <p><strong>Authority:</strong> {config.authority?.toBase58()}</p>
            <p><strong>Treasury:</strong> {config.treasury?.toBase58()}</p>
            <p><strong>Protocol Fee:</strong> {config.protocolFeeBps} bps ({(config.protocolFeeBps / 100).toFixed(2)}%)</p>
            <p><strong>Total Matches:</strong> {config.totalMatches?.toString()}</p>
            <p><strong>Total Volume:</strong> {config.totalVolume?.toString()} lamports</p>
            <p><strong>Paused:</strong> {config.paused ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}

      {markets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Markets ({markets.length})</h2>
          <div className="grid gap-4">
            {markets.map((market, idx) => (
              <div key={idx} className="bg-gray-100 p-4 rounded">
                <p><strong>Name:</strong> {market.name}</p>
                <p><strong>Address:</strong> {market.address.toBase58()}</p>
                {market.data && (
                  <>
                    <p><strong>Market ID:</strong> {market.data.marketId?.toString()}</p>
                    <p><strong>Description:</strong> {market.data.description}</p>
                    <p><strong>Active:</strong> {market.data.active ? 'Yes' : 'No'}</p>
                    <p><strong>Total Matches:</strong> {market.data.totalMatches?.toString()}</p>
                    <p><strong>Pyth Feed:</strong> {market.data.pythPriceFeed?.toBase58()}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recent Matches ({matches.length})</h2>
          <div className="grid gap-4">
            {matches.map((match, idx) => (
              <div key={idx} className="bg-gray-100 p-4 rounded">
                <p><strong>Match ID:</strong> {match.account.matchId?.toString()}</p>
                <p><strong>Status:</strong> {JSON.stringify(match.account.status)}</p>
                <p><strong>Entry Fee:</strong> {match.account.entryFee?.toString()} lamports</p>
                <p><strong>Players:</strong> {match.account.currentPlayers} / {match.account.maxPlayers}</p>
                <p><strong>Total Pot:</strong> {match.account.totalPot?.toString()} lamports</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && config && (
        <div className="mb-8 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No matches found. The protocol is ready - create the first match!</p>
        </div>
      )}
    </div>
  )
}
