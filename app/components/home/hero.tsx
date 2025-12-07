'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function Hero() {
  const { connected } = useWallet()

  return (
    <section className="relative min-h-screen flex items-center justify-center gradient-fate">
      <div className="container mx-auto px-4 text-center text-white">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-fade-in">
          FATE Protocol
        </h1>
        <p className="text-2xl md:text-3xl mb-8 opacity-90">
          Real-Time PvP Prediction Battles on Solana
        </p>
        <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto opacity-80">
          Battle against other players in real-time prediction markets. Use your
          market instincts to predict price movements and claim victory.
        </p>

        <div className="flex gap-4 justify-center">
          {connected ? (
            <Link href="/arena">
              <Button size="lg" className="text-lg px-8 py-6">
                Enter Arena
              </Button>
            </Link>
          ) : (
            <WalletMultiButton className="!bg-white !text-purple-600 hover:!bg-gray-100" />
          )}
          <Link href="/governance">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10">
              Governance
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="glass p-6 rounded-lg">
            <h3 className="text-3xl font-bold mb-2">$10M+</h3>
            <p className="opacity-80">Total Volume</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-3xl font-bold mb-2">50K+</h3>
            <p className="opacity-80">Players</p>
          </div>
          <div className="glass p-6 rounded-lg">
            <h3 className="text-3xl font-bold mb-2">100K+</h3>
            <p className="opacity-80">Matches Played</p>
          </div>
        </div>
      </div>
    </section>
  )
}
