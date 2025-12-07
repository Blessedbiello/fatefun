# FATE Protocol Frontend - Complete Implementation Guide

## Overview
This document provides the complete frontend setup for FATE Protocol with working wallet connection, Anchor program integration, and all required hooks and components.

## Tech Stack
- **Next.js 14** (App Router)
- **Solana Wallet Adapter** (Phantom, Solflare, Backpack)
- **Anchor** (@project-serum/anchor)
- **React Query** (@tanstack/react-query)
- **Zustand** (state management)
- **TailwindCSS** + **shadcn/ui** (styling)

## Environment Variables

Create `.env.local`:

```env
# Network Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Program IDs
NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID=FATEarenaBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump
NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID=FATEcouncBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump

# Optional: Custom RPC
# NEXT_PUBLIC_RPC_ENDPOINT=https://your-rpc-endpoint.com
```

## Directory Structure

```
app/
├── hooks/
│   ├── useProgram.ts         # Anchor program initialization
│   ├── useGameConfig.ts      # Fetch GameConfig PDA
│   ├── useMatches.ts         # Fetch & filter matches
│   ├── useMatch.ts           # Single match with updates
│   ├── useUserProfile.ts     # User stats
│   ├── useLeaderboard.ts     # Top players
│   ├── useProposals.ts       # Council proposals
│   └── useProposal.ts        # Single proposal
├── store/
│   ├── useAppStore.ts        # Global app state
│   └── useMatchStore.ts      # Match-specific state
├── components/
│   ├── wallet/
│   │   ├── WalletButton.tsx
│   │   ├── NetworkBadge.tsx
│   │   └── SolBalance.tsx
│   ├── arena/
│   │   ├── MatchCard.tsx
│   │   ├── PredictionForm.tsx
│   │   └── MatchStatus.tsx
│   ├── council/
│   │   ├── ProposalCard.tsx
│   │   ├── TradeForm.tsx
│   │   └── PriceIndicator.tsx
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── utils.ts          # Utility functions
│   ├── constants.ts      # Program constants
│   └── format.ts         # Formatting helpers
└── types/
    ├── arena.ts          # Arena type definitions
    └── council.ts        # Council type definitions
```

## Core Hooks Implementation

### 1. useProgram.ts

```typescript
import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import FateArenaIDL from '@/idl/fate_arena.json'
import FateCouncilIDL from '@/idl/fate_council.json'

export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return useMemo(() => {
    if (!wallet.publicKey) return null
    return new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions())
  }, [connection, wallet])
}

export function useFateArenaProgram() {
  const provider = useAnchorProvider()
  return useMemo(() => {
    if (!provider) return null
    const programId = new PublicKey(process.env.NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID!)
    return new Program(FateArenaIDL as any, programId, provider)
  }, [provider])
}

// PDA helpers
export function getProgramPDAs(programId: PublicKey) {
  return {
    getGameConfig: () => PublicKey.findProgramAddressSync([Buffer.from('game_config')], programId),
    getMatch: (matchId: bigint) => PublicKey.findProgramAddressSync([Buffer.from('match'), Buffer.from(matchId.toString())], programId),
    getUserProfile: (user: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from('user_profile'), user.toBuffer()], programId),
  }
}
```

### 2. useGameConfig.ts

```typescript
import { useQuery } from '@tanstack/react-query'
import { useFateArenaProgram, getProgramPDAs } from './useProgram'

export function useGameConfig() {
  const program = useFateArenaProgram()

  return useQuery({
    queryKey: ['gameConfig'],
    queryFn: async () => {
      if (!program) return null
      const [configPDA] = getProgramPDAs(program.programId).getGameConfig()
      return await program.account.gameConfig.fetch(configPDA)
    },
    enabled: !!program,
    staleTime: 60000, // 1 minute
  })
}
```

### 3. useMatches.ts

```typescript
import { useQuery } from '@tanstack/react-query'
import { useFateArenaProgram } from './useProgram'

export interface MatchFilters {
  status?: 'Open' | 'InProgress' | 'Completed'
  matchType?: 'FlashDuel' | 'BattleRoyale' | 'Tournament'
  limit?: number
}

export function useMatches(filters: MatchFilters = {}) {
  const program = useFateArenaProgram()

  return useQuery({
    queryKey: ['matches', filters],
    queryFn: async () => {
      if (!program) return []

      let matches = await program.account.match.all()

      // Apply filters
      if (filters.status) {
        matches = matches.filter(m => m.account.status === filters.status)
      }
      if (filters.matchType) {
        matches = matches.filter(m => m.account.matchType === filters.matchType)
      }
      if (filters.limit) {
        matches = matches.slice(0, filters.limit)
      }

      return matches
    },
    enabled: !!program,
    refetchInterval: 5000, // Poll every 5 seconds
  })
}
```

### 4. useMatch.ts

```typescript
import { useQuery } from '@tanstack/react-query'
import { PublicKey } from '@solana/web3.js'
import { useFateArenaProgram } from './useProgram'

export function useMatch(matchPubkey: PublicKey | string) {
  const program = useFateArenaProgram()

  return useQuery({
    queryKey: ['match', matchPubkey.toString()],
    queryFn: async () => {
      if (!program) return null
      const pubkey = typeof matchPubkey === 'string' ? new PublicKey(matchPubkey) : matchPubkey
      return await program.account.match.fetch(pubkey)
    },
    enabled: !!program && !!matchPubkey,
    refetchInterval: 3000, // Real-time updates
  })
}
```

### 5. useUserProfile.ts

```typescript
import { useQuery } from '@tanstack/react-query'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useFateArenaProgram, getProgramPDAs } from './useProgram'

export function useUserProfile(address?: PublicKey | string) {
  const program = useFateArenaProgram()
  const wallet = useWallet()

  // Use provided address or connected wallet
  const userAddress = address || wallet.publicKey

  return useQuery({
    queryKey: ['userProfile', userAddress?.toString()],
    queryFn: async () => {
      if (!program || !userAddress) return null

      const pubkey = typeof userAddress === 'string' ? new PublicKey(userAddress) : userAddress
      const [profilePDA] = getProgramPDAs(program.programId).getUserProfile(pubkey)

      try {
        return await program.account.userProfile.fetch(profilePDA)
      } catch (e) {
        // Profile doesn't exist yet
        return null
      }
    },
    enabled: !!program && !!userAddress,
  })
}
```

### 6. useLeaderboard.ts

```typescript
import { useQuery } from '@tanstack/react-query'
import { useFateArenaProgram } from './useProgram'

export function useLeaderboard(limit = 100) {
  const program = useFateArenaProgram()

  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      if (!program) return []

      const profiles = await program.account.userProfile.all()

      // Sort by XP (descending)
      return profiles
        .sort((a, b) => Number(b.account.xp) - Number(a.account.xp))
        .slice(0, limit)
    },
    enabled: !!program,
    staleTime: 30000, // 30 seconds
  })
}
```

## Component Implementation

### WalletButton.tsx

```typescript
'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export function WalletButton() {
  return (
    <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-700 hover:!to-pink-700 !rounded-lg !font-medium" />
  )
}
```

### NetworkBadge.tsx

```typescript
'use client'

import { useAppStore } from '@/store/useAppStore'
import { Badge } from '@/components/ui/badge'

export function NetworkBadge() {
  const network = useAppStore((s) => s.network)

  const isDevnet = network === 'devnet'

  return (
    <Badge variant={isDevnet ? 'warning' : 'success'}>
      {isDevnet ? 'Devnet' : 'Mainnet'}
    </Badge>
  )
}
```

### SolBalance.tsx

```typescript
'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

export function SolBalance() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const { data: balance } = useQuery({
    queryKey: ['balance', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return 0
      const lamports = await connection.getBalance(publicKey)
      return lamports / LAMPORTS_PER_SOL
    },
    enabled: !!publicKey,
    refetchInterval: 10000, // Every 10 seconds
  })

  if (!publicKey) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700">
      <span className="text-sm text-gray-400">Balance:</span>
      <span className="text-sm font-medium text-white">
        {balance?.toFixed(4) || '0.0000'} SOL
      </span>
    </div>
  )
}
```

## Usage Examples

### Fetching Matches in Arena Page

```typescript
'use client'

import { useMatches } from '@/hooks/useMatches'
import { MatchCard } from '@/components/arena/MatchCard'

export default function ArenaPage() {
  const { data: matches, isLoading } = useMatches({
    status: 'Open',
    limit: 20
  })

  if (isLoading) return <div>Loading matches...</div>

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {matches?.map((match) => (
        <MatchCard key={match.publicKey.toString()} match={match.account} />
      ))}
    </div>
  )
}
```

### Displaying User Profile

```typescript
'use client'

import { useUserProfile } from '@/hooks/useUserProfile'
import { useWallet } from '@solana/wallet-adapter-react'

export default function ProfilePage() {
  const { publicKey } = useWallet()
  const { data: profile, isLoading } = useUserProfile(publicKey)

  if (!publicKey) return <div>Connect wallet to view profile</div>
  if (isLoading) return <div>Loading profile...</div>
  if (!profile) return <div>No profile found. Start playing to create one!</div>

  return (
    <div>
      <h1>Level {profile.level}</h1>
      <p>XP: {profile.xp.toString()}</p>
      <p>Wins: {profile.wins.toString()}</p>
      <p>Losses: {profile.losses.toString()}</p>
      <p>Win Rate: {((profile.wins / (profile.wins + profile.losses)) * 100).toFixed(2)}%</p>
    </div>
  )
}
```

## Next Steps

1. Generate IDL files: `anchor build && anchor idl parse` in programs directory
2. Copy IDL JSON files to `app/idl/` directory
3. Install dependencies: `npm install @project-serum/anchor @solana/wallet-adapter-react zustand`
4. Run `npm run dev` to start development server
5. Connect wallet and test program interactions

## Additional Hooks Needed

- `useSubmitPrediction()` - Submit prediction transaction
- `useClaimWinnings()` - Claim match winnings
- `useCreateMatch()` - Create new match
- `useCreateProposal()` - Create council proposal
- `useTradeOutcome()` - Trade on proposal outcome
- `useClaimVoteTokens()` - Claim proposal winnings

These hooks follow the same pattern: use `useMutation` from React Query and call program methods.
