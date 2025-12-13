import { Hero } from '@/components/home/hero'
import { Features } from '@/components/home/features'
import { HowItWorks } from '@/components/home/how-it-works'
import { ActiveMatches } from '@/components/home/active-matches'
import { Stats } from '@/components/home/stats'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HowItWorks />
      <ActiveMatches />
      <Features />
      <Stats />
    </main>
  )
}
