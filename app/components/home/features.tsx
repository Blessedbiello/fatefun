'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    title: 'Real-Time Battles',
    description: 'Compete against other players in live prediction markets with instant results',
    icon: '⚔️',
  },
  {
    title: 'Pyth Oracle Integration',
    description: 'Powered by Pyth Network for accurate, tamper-proof price feeds',
    icon: '🔮',
  },
  {
    title: 'Community Governance',
    description: 'Vote on new markets and protocol changes through the FATE Council',
    icon: '🏛️',
  },
  {
    title: 'Multiple Market Types',
    description: 'Trade on price direction, price targets, and price ranges',
    icon: '📊',
  },
  {
    title: 'Player Progression',
    description: 'Level up, unlock achievements, and climb the leaderboard',
    icon: '🏆',
  },
  {
    title: 'Low Fees',
    description: 'Only 2.5% platform fee, powered by Solana\'s low transaction costs',
    icon: '💰',
  },
]

export function Features() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
          Why FATE Protocol?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
