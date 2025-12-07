# Real-time Game State Management - Integration Guide

This document shows how to integrate all the real-time features in your FATE Protocol components.

## Complete System Overview

### 1. Core Infrastructure

✅ **gameStore.ts** - Central Zustand store for all game state
- Match state, player data, countdown, prices
- Transaction status tracking
- Optimistic updates
- WebSocket connection status
- Sound effects management

✅ **usePriceSubscription.ts** - Real-time Pyth price feeds
- WebSocket subscription with polling fallback
- Mock price generator for testing
- Automatic price history tracking

✅ **useMatchSubscription.ts** - Match account subscriptions
- WebSocket subscription for match changes
- Smart polling (faster for active matches)
- Player join/leave detection with sounds

✅ **useGameCountdown.ts** - Countdown timers
- Prediction window countdown
- Resolution countdown
- Auto-refresh on timer end
- Warning callbacks at intervals

✅ **PriceChart.tsx** - TradingView Lightweight Charts
- Candlestick chart with prediction zones
- Start price line marker
- Higher/Lower zone visualization
- Real-time updates

✅ **transactions.ts** - Transaction utilities
- Priority fee estimation
- Retry logic
- Transaction simulation
- Confirmation tracking

✅ **sounds.ts** - Sound effects system
- Preloading and caching
- Volume control
- LocalStorage persistence
- React hook interface

## Quick Start Integration

### Example: Complete Match Page

```typescript
'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useFateArenaProgram } from '@/hooks/useProgram'
import { useGameStore } from '@/store/gameStore'
import { usePriceSubscription } from '@/hooks/usePriceSubscription'
import { useMatchSubscription } from '@/hooks/useMatchSubscription'
import { useGameCountdown } from '@/hooks/useGameCountdown'
import { MatchArena } from '@/components/arena/MatchArena'
import { PriceChart } from '@/components/arena/PriceChart'

export default function MatchPage() {
  const params = useParams()
  const { publicKey } = useWallet()
  const program = useFateArenaProgram()

  // Zustand store
  const currentMatch = useGameStore((s) => s.currentMatch)
  const currentPrice = useGameStore((s) => s.currentPrice)
  const setCurrentMatch = useGameStore((s) => s.setCurrentMatch)
  const submitPrediction = useGameStore((s) => s.submitPrediction)
  const reset = useGameStore((s) => s.reset)

  const matchPubkey = params.matchId as string

  // Subscribe to match updates
  useMatchSubscription({
    matchPubkey,
    enabled: !!matchPubkey,
  })

  // Subscribe to price updates (only if match is active)
  usePriceSubscription({
    marketId: currentMatch?.marketId || 0,
    enabled: !!currentMatch && currentMatch.status !== 'Completed',
  })

  // Countdown timer with callbacks
  const { countdown, formattedTime, isWarning, isCritical } = useGameCountdown({
    enabled: !!currentMatch,
    onCountdownEnd: () => {
      console.log('⏰ Countdown ended!')
      // Auto-refresh handled by subscription
    },
    onWarning: (seconds) => {
      console.log(`⚠️ ${seconds} seconds remaining`)
    },
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  // Handle prediction submission
  const handlePredict = async (side: 'higher' | 'lower') => {
    if (!program || !publicKey) return

    try {
      await submitPrediction(side, program, wallet)
    } catch (error) {
      console.error('Prediction failed:', error)
    }
  }

  if (!currentMatch) {
    return <div>Loading match...</div>
  }

  return (
    <div className="space-y-6">
      {/* Price Chart */}
      <PriceChart match={currentMatch} height={400} />

      {/* Match Arena (includes PredictionPanel, PlayerList, etc.) */}
      <MatchArena
        match={currentMatch}
        currentPrice={currentPrice}
        onPredict={handlePredict}
      />

      {/* Debug Info */}
      <div className="p-4 bg-gray-800 rounded-lg text-xs font-mono">
        <div>Countdown: {formattedTime}</div>
        <div>Current Price: ${currentPrice.toFixed(2)}</div>
        <div>Players: {currentMatch.currentPlayers}/{currentMatch.maxPlayers}</div>
      </div>
    </div>
  )
}
```

## Feature Details

### 1. WebSocket Subscriptions

**Price Subscription:**
```typescript
usePriceSubscription({
  marketId: 0, // SOL/USD
  enabled: true,
  pollingInterval: 2000, // Fallback polling every 2s
})
```

**Match Subscription:**
```typescript
useMatchSubscription({
  matchPubkey: new PublicKey('...'),
  enabled: true,
  pollingInterval: 2000,
})
```

### 2. Countdown Management

```typescript
const { countdown, formattedTime, isWarning, isCritical } = useGameCountdown({
  enabled: true,
  onCountdownEnd: () => {
    // Match status changed (Open -> InProgress or InProgress -> Completed)
    console.log('Timer ended!')
  },
  onWarning: (seconds) => {
    // Called at 60, 30, 10, 5 seconds
    if (seconds === 10) {
      showNotification('Match ending soon!')
    }
  },
})

// Use in UI
<div className={isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : ''}>
  {formattedTime}
</div>
```

### 3. Optimistic Updates

```typescript
// In gameStore, predictions show immediately
const submitPrediction = async (side, program, wallet) => {
  // Show optimistic prediction
  set({ optimisticPrediction: side })

  try {
    await sendTransaction(...)
    // Keep optimistic state until confirmed
  } catch (error) {
    // Revert on failure
    set({ optimisticPrediction: null })
  }
}

// In UI
const displayPrediction = playerEntry?.prediction || optimisticPrediction
```

### 4. Transaction Handling

```typescript
import { sendTransactionWithRetry, estimatePriorityFee } from '@/lib/transactions'

// Automatic retries with priority fees
const result = await sendTransactionWithRetry(
  connection,
  transaction,
  wallet,
  {
    priorityFee: 50_000, // Or use estimatePriorityFee()
    computeUnits: 200_000,
    maxRetries: 3,
    confirmationTimeout: 30000,
  }
)

if (result.confirmed) {
  console.log('✅ Transaction confirmed:', result.signature)
} else {
  console.error('❌ Transaction failed:', result.error)
}
```

### 5. Sound Effects

```typescript
import { playSound, useSoundManager } from '@/lib/sounds'

// Simple usage
playSound('predict')
playSound('win')
playSound('countdown')

// With React hook
const { enabled, volume, play, toggle, setVolume } = useSoundManager()

<button onClick={toggle}>
  {enabled ? '🔊' : '🔇'} Sound {enabled ? 'On' : 'Off'}
</button>

<input
  type="range"
  min="0"
  max="100"
  value={volume * 100}
  onChange={(e) => setVolume(Number(e.target.value) / 100)}
/>
```

### 6. Price Chart Integration

```typescript
import { PriceChart, SimplePriceChart } from '@/components/arena/PriceChart'

// Full-featured chart
<PriceChart match={currentMatch} height={400} />

// Simple line chart (lighter weight)
<SimplePriceChart match={currentMatch} height={300} />
```

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        gameStore                             │
│  - currentMatch, currentPrice, countdown, playerEntry       │
│  - optimisticPrediction, txStatus, wsConnected              │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┬─────────────┐
        │                     │              │             │
        ▼                     ▼              ▼             ▼
┌───────────────┐   ┌────────────────┐   ┌──────────┐   ┌──────────┐
│ Price Sub     │   │  Match Sub     │   │ Countdown│   │  Chart   │
│ (WebSocket/   │   │  (WebSocket/   │   │  Timer   │   │ (TView)  │
│  Polling)     │   │   Polling)     │   │          │   │          │
└───────┬───────┘   └────────┬───────┘   └────┬─────┘   └────┬─────┘
        │                     │                │              │
        ▼                     ▼                ▼              ▼
   updatePrice          setCurrentMatch   setCountdown   renderChart
```

## Performance Optimization

### Smart Polling Intervals

```typescript
// Match subscription adjusts polling based on status
if (match.status === 'Open' || match.status === 'InProgress') {
  pollingInterval = 2000 // Poll every 2s for active matches
} else {
  pollingInterval = 10000 // Poll every 10s for completed matches
}
```

### WebSocket Fallback

```typescript
// Automatic fallback to polling if WebSocket fails
try {
  subscriptionId = connection.onAccountChange(pubkey, callback)
  setWsConnected(true)
} catch (error) {
  console.warn('WebSocket failed, using polling')
  startPolling()
}
```

### Price Data Optimization

```typescript
// Only update chart if price actually changed
if (priceValue !== lastPriceRef.current) {
  lastPriceRef.current = priceValue
  updateCurrentPrice(priceValue)
}

// Aggregate candles (5-second intervals)
if (timeDiff >= 5) {
  createNewCandle()
} else {
  updateCurrentCandle()
}
```

## Testing with Mock Data

### Mock Price Generator

```typescript
import { useMockPriceGenerator } from '@/hooks/usePriceSubscription'

// In your component (for testing without Pyth)
useMockPriceGenerator({
  basePrice: 100,
  enabled: process.env.NODE_ENV === 'development',
})
```

### Mock Sounds

Place sound files in `public/sounds/`:
- `countdown.mp3`
- `predict.mp3`
- `win.mp3`
- `lose.mp3`
- `join.mp3`
- `click.mp3`
- `error.mp3`
- `notification.mp3`

Or sounds will gracefully fail with console warnings.

## Error Handling

### Connection Errors

```typescript
const wsConnected = useGameStore((s) => s.wsConnected)
const priceWsConnected = useGameStore((s) => s.priceWsConnected)
const matchWsConnected = useGameStore((s) => s.matchWsConnected)

// Show connection status
{!wsConnected && <div>⚠️ Connection unstable, using polling</div>}
```

### Transaction Errors

```typescript
const txStatus = useGameStore((s) => s.txStatus)

{txStatus === 'pending' && <Spinner />}
{txStatus === 'confirmed' && <SuccessIcon />}
{txStatus === 'failed' && <ErrorIcon />}
```

## Required Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "@pythnetwork/client": "^2.16.0",
    "lightweight-charts": "^4.1.0",
    "zustand": "^4.4.7"
  }
}
```

Install:
```bash
npm install @pythnetwork/client lightweight-charts zustand
```

## Next Steps

1. **Add sound files** to `public/sounds/` directory
2. **Test WebSocket connections** on devnet
3. **Implement match pages** using the integration example
4. **Add notification toasts** for transaction status
5. **Test optimistic updates** with slow network
6. **Profile performance** with React DevTools

## Troubleshooting

**WebSocket not connecting?**
- Check RPC endpoint supports WebSocket (wss://)
- Verify account exists before subscribing
- Check browser console for errors

**Sounds not playing?**
- User must interact with page first (browser autoplay policy)
- Check sound files exist in `public/sounds/`
- Check volume settings in sound manager

**Chart not rendering?**
- Verify `priceHistory` has data
- Check container has valid dimensions
- Look for TypeScript errors in chart component

**High memory usage?**
- Limit `priceHistory` array size (keep last 1000 points)
- Clear old candles periodically
- Unsubscribe when component unmounts
