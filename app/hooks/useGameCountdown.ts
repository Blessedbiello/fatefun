import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MatchStatus } from '@/types/arena'

interface CountdownOptions {
  enabled?: boolean
  onCountdownEnd?: () => void
  onWarning?: (seconds: number) => void
}

export function useGameCountdown({ enabled = true, onCountdownEnd, onWarning }: CountdownOptions = {}) {
  const currentMatch = useGameStore((s) => s.currentMatch)
  const setCountdown = useGameStore((s) => s.setCountdown)
  const countdown = useGameStore((s) => s.countdown)
  const refreshMatch = useGameStore((s) => s.refreshMatch)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasEndedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !currentMatch) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const updateCountdown = () => {
      const now = Date.now() / 1000

      let targetTime: number

      if (currentMatch.status === MatchStatus.Open) {
        // Countdown to prediction deadline
        targetTime = Number(currentMatch.predictionDeadline)
      } else if (currentMatch.status === MatchStatus.InProgress) {
        // Countdown to resolution time
        targetTime = Number(currentMatch.resolutionTime)
      } else {
        // No countdown for completed/cancelled matches
        setCountdown(0)
        return
      }

      const remaining = Math.max(0, targetTime - now)
      setCountdown(remaining)

      // Trigger warning callback at specific intervals
      if (onWarning && [60, 30, 10, 5].includes(Math.floor(remaining))) {
        onWarning(Math.floor(remaining))
      }

      // Countdown ended
      if (remaining === 0 && !hasEndedRef.current) {
        hasEndedRef.current = true

        if (onCountdownEnd) {
          onCountdownEnd()
        }

        // Auto-refresh match when countdown ends
        // This will trigger status change from Open -> InProgress or InProgress -> Completed
        setTimeout(() => {
          // Need program instance - this will be handled by the component using this hook
          console.log('⏰ Countdown ended - match should be refreshed by component')
        }, 1000)
      }

      // Reset hasEnded flag when countdown restarts
      if (remaining > 0) {
        hasEndedRef.current = false
      }
    }

    // Initial update
    updateCountdown()

    // Update every second
    intervalRef.current = setInterval(updateCountdown, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, currentMatch, setCountdown, onCountdownEnd, onWarning])

  return {
    countdown,
    formattedTime: formatCountdown(countdown),
    isWarning: countdown > 0 && countdown <= 60,
    isCritical: countdown > 0 && countdown <= 10,
  }
}

// Format countdown as MM:SS or HH:MM:SS
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Hook for simple time remaining display (without store integration)
export function useTimeRemaining(targetTimestamp: number | bigint | null): {
  remaining: number
  formatted: string
  expired: boolean
} {
  const [remaining, setRemaining] = React.useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!targetTimestamp) return

    const updateRemaining = () => {
      const now = Date.now() / 1000
      const target = Number(targetTimestamp)
      const diff = Math.max(0, target - now)
      setRemaining(diff)
    }

    updateRemaining()
    intervalRef.current = setInterval(updateRemaining, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [targetTimestamp])

  return {
    remaining,
    formatted: formatCountdown(remaining),
    expired: remaining === 0,
  }
}

// React import for useTimeRemaining hook
import React from 'react'

// Hook for periodic auto-refresh based on match state
export function useAutoRefresh(program: any, interval: number = 5000) {
  const currentMatch = useGameStore((s) => s.currentMatch)
  const refreshMatch = useGameStore((s) => s.refreshMatch)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!program || !currentMatch) return

    // Only auto-refresh for active matches
    if (
      currentMatch.status !== MatchStatus.Open &&
      currentMatch.status !== MatchStatus.InProgress
    ) {
      return
    }

    const refresh = () => {
      refreshMatch(program)
    }

    intervalRef.current = setInterval(refresh, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [program, currentMatch, refreshMatch, interval])
}
