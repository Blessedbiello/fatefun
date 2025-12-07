import { Hero } from '@/components/home/hero'
import { Features } from '@/components/home/features'
import { ActiveMatches } from '@/components/home/active-matches'
import { Stats } from '@/components/home/stats'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Stats />
      <ActiveMatches />
      <Features />
    </main>
  )
}
