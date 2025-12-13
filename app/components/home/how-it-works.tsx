'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Target, Coins, Sparkles } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Choose Your Battle',
    description: 'Select from Flash Duels, Battle Royale, or Tournament modes. Each match type offers unique challenges and rewards.',
    icon: Target,
    color: 'from-purple-600 to-purple-400',
  },
  {
    number: '02',
    title: 'Make Your Prediction',
    description: 'Will the price go HIGHER or LOWER? Lock in your prediction before the countdown expires. Time is ticking!',
    icon: Sparkles,
    color: 'from-pink-600 to-pink-400',
  },
  {
    number: '03',
    title: 'Battle Begins',
    description: 'Watch the price action in real-time. Pyth oracles provide instant, tamper-proof price feeds every second.',
    icon: Trophy,
    color: 'from-blue-600 to-blue-400',
  },
  {
    number: '04',
    title: 'Claim Victory',
    description: 'Match resolves automatically. Winners split the prize pool minus 5% platform fee. Claim your rewards instantly!',
    icon: Coins,
    color: 'from-green-600 to-green-400',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              HOW IT WORKS
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Four simple steps from prediction to profit. Get started in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-2 border-gray-800 hover:border-purple-500 transition-all bg-gray-900/50 backdrop-blur-sm group hover:scale-105 transform"
            >
              {/* Background gradient glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>

              <CardContent className="p-6 relative z-10">
                {/* Step number */}
                <div className="text-7xl font-black text-gray-800 mb-4">
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`inline-block p-4 rounded-xl bg-gradient-to-br ${step.color} mb-4`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </CardContent>

              {/* Connector line (except last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-purple-500 to-transparent z-20"></div>
              )}
            </Card>
          ))}
        </div>

        {/* Match types info */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="glass p-6 rounded-xl border border-purple-500/30 text-center">
            <div className="text-4xl mb-3">⚔️</div>
            <h4 className="text-xl font-bold text-white mb-2">Flash Duel</h4>
            <p className="text-sm text-gray-400">Quick 1v1 battles. Fast-paced action for instant results.</p>
          </div>

          <div className="glass p-6 rounded-xl border border-pink-500/30 text-center">
            <div className="text-4xl mb-3">👑</div>
            <h4 className="text-xl font-bold text-white mb-2">Battle Royale</h4>
            <p className="text-sm text-gray-400">Last player standing wins it all. Maximum risk, maximum reward.</p>
          </div>

          <div className="glass p-6 rounded-xl border border-blue-500/30 text-center">
            <div className="text-4xl mb-3">🏆</div>
            <h4 className="text-xl font-bold text-white mb-2">Tournament</h4>
            <p className="text-sm text-gray-400">Multi-round competitions. Climb the ranks to claim glory.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
