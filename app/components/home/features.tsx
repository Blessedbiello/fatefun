'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Zap, TrendingUp, Users, Lock, BarChart3 } from 'lucide-react'

const features = [
  {
    title: 'Lightning Fast',
    description: 'Solana-powered transactions with sub-second settlement. No waiting, just pure action.',
    icon: Zap,
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    title: 'Provably Fair',
    description: 'Pyth Network oracles ensure tamper-proof price feeds. Every match is verifiable on-chain.',
    icon: Shield,
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    title: 'Real-Time Action',
    description: 'Live price updates every second. Watch your predictions play out in real-time battles.',
    icon: TrendingUp,
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    title: 'Multiplayer PvP',
    description: 'Compete against real players worldwide. Test your market instincts against the best.',
    icon: Users,
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    title: 'Secure & Transparent',
    description: 'All funds locked in smart contracts. No custody, no middlemen, no trust required.',
    icon: Lock,
    gradient: 'from-red-400 to-rose-500',
  },
  {
    title: 'Track Your Stats',
    description: 'Detailed performance analytics. Level up your skills and dominate the leaderboards.',
    icon: BarChart3,
    gradient: 'from-indigo-400 to-violet-500',
  },
]

export function Features() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              GAME FEATURES
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Built for speed, designed for winners. Experience the future of prediction markets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl hover:shadow-purple-500/20 transition-all transform hover:scale-105 border-2 border-gray-800 hover:border-purple-500 bg-gray-900/50 backdrop-blur-sm overflow-hidden relative"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <CardHeader className="relative z-10">
                {/* Icon with gradient */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <CardTitle className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-600 group-hover:bg-clip-text transition-all">
                  {feature.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="relative z-10">
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional info banner */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="glass p-8 rounded-2xl border border-purple-500/30 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Powered by Leading Web3 Infrastructure
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <p className="text-sm text-gray-400">Solana Network</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🔮</div>
                <p className="text-sm text-gray-400">Pyth Oracles</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⚓</div>
                <p className="text-sm text-gray-400">Anchor Framework</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎮</div>
                <p className="text-sm text-gray-400">Moddio Engine</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
