'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Swords, TrendingUp, Users, Zap } from 'lucide-react'

export function Hero() {
  const { connected } = useWallet()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 text-center text-white relative z-10">
        {/* Game-style header */}
        <div className="inline-block mb-6">
          <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50 rounded-full backdrop-blur-sm">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-semibold tracking-wide">LIVE ON SOLANA DEVNET</span>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-6 animate-fade-in">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            FATE PROTOCOL
          </span>
        </h1>

        <div className="flex items-center justify-center gap-3 mb-8">
          <Swords className="w-8 h-8 text-purple-400" />
          <p className="text-3xl md:text-4xl font-bold opacity-90">
            PvP Prediction Battles
          </p>
          <Swords className="w-8 h-8 text-pink-400" />
        </div>

        <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto opacity-90 font-medium">
          Enter the arena and battle opponents in real-time price prediction duels.
        </p>
        <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto opacity-75">
          Powered by Pyth oracles on Solana. Predict. Battle. Win.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          {connected ? (
            <Link href="/arena">
              <Button
                size="lg"
                className="text-lg px-10 py-7 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl shadow-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/60 transition-all transform hover:scale-105"
              >
                <Swords className="w-5 h-5 mr-2" />
                ENTER ARENA
              </Button>
            </Link>
          ) : (
            <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-700 hover:!to-pink-700 !text-white !text-lg !px-10 !py-7 !rounded-lg !shadow-xl !shadow-purple-500/50" />
          )}
          <Link href="#how-it-works">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-7 border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              HOW IT WORKS
            </Button>
          </Link>
        </div>

        {/* Game Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="glass p-6 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all transform hover:scale-105">
            <div className="text-5xl mb-2">⚡</div>
            <h3 className="text-3xl font-bold mb-1 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              &lt;1s
            </h3>
            <p className="opacity-80 text-sm">Settlement Time</p>
          </div>

          <div className="glass p-6 rounded-xl border border-pink-500/30 hover:border-pink-400/50 transition-all transform hover:scale-105">
            <div className="text-5xl mb-2">🎯</div>
            <h3 className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              3
            </h3>
            <p className="opacity-80 text-sm">Match Types</p>
          </div>

          <div className="glass p-6 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all transform hover:scale-105">
            <div className="text-5xl mb-2">💎</div>
            <h3 className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              5%
            </h3>
            <p className="opacity-80 text-sm">Platform Fee</p>
          </div>

          <div className="glass p-6 rounded-xl border border-pink-500/30 hover:border-pink-400/50 transition-all transform hover:scale-105">
            <div className="text-5xl mb-2">🔮</div>
            <h3 className="text-3xl font-bold mb-1 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Pyth
            </h3>
            <p className="opacity-80 text-sm">Oracle Powered</p>
          </div>
        </div>
      </div>
    </section>
  )
}
