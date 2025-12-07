# FATE Protocol Frontend Structure

## Completed Files

### Core Setup
- ✅ `/app/layout.tsx` - Root layout with Navigation
- ✅ `/components/providers.tsx` - Wallet & React Query providers
- ✅ `/components/navigation.tsx` - Main navigation bar

## Required Pages

### Landing/Home
- `/app/page.tsx` - Hero, features, stats, CTA

### Arena (Match System)
- `/app/arena/page.tsx` - Browse active/completed matches
- `/app/arena/[matchId]/page.tsx` - Match detail & prediction interface
- `/app/arena/create/page.tsx` - Create new match

### Council (Governance)
- `/app/council/page.tsx` - Browse proposals
- `/app/council/[proposalId]/page.tsx` - Proposal detail & trading
- `/app/council/propose/page.tsx` - Create proposal

### Profile & Leaderboard
- `/app/profile/page.tsx` - Current user stats
- `/app/profile/[address]/page.tsx` - Public profile view
- `/app/leaderboard/page.tsx` - Top players ranking

## Required Hooks

### Solana Program Hooks
- `/hooks/useFateArena.ts` - Arena program interactions
- `/hooks/useFateCouncil.ts` - Council program interactions
- `/hooks/useMatches.ts` - Fetch & filter matches
- `/hooks/useProposals.ts` - Fetch & filter proposals
- `/hooks/useUserProfile.ts` - User stats & history

## Required Components

### Arena Components
- `/components/arena/MatchCard.tsx` - Match list item
- `/components/arena/PredictionForm.tsx` - Submit prediction
- `/components/arena/MatchStatus.tsx` - Match state display
- `/components/arena/PriceChart.tsx` - Price movement visualization

### Council Components
- `/components/council/ProposalCard.tsx` - Proposal list item
- `/components/council/TradeForm.tsx` - Pass/Fail trading
- `/components/council/PriceIndicator.tsx` - Pass/Fail prices
- `/components/council/LiquidityPools.tsx` - Pool stats

### Shared Components
- `/components/ui/Button.tsx`
- `/components/ui/Card.tsx`
- `/components/ui/Input.tsx`
- `/components/ui/Modal.tsx`
- `/components/ui/Badge.tsx`
- `/components/ui/Skeleton.tsx`

## Key Features to Implement

### Arena Features
1. Real-time match browsing with filters
2. Live price updates from Pyth
3. Prediction submission with amount input
4. Match resolution & claiming
5. Match history & stats

### Council Features
1. Proposal browsing with status filters
2. AMM-style trading interface
3. Real-time price updates
4. Liquidity pool visualization
5. Claim winnings interface

### Profile Features
1. User statistics (wins, losses, profit)
2. Match history table
3. XP & level progress bar
4. Win streak display
5. Earnings chart

### Leaderboard Features
1. Sortable rankings (XP, profit, win rate)
2. Pagination
3. Search by address
4. Time period filters (all-time, monthly, weekly)

## Technical Notes

- Use `@tanstack/react-query` for data fetching
- Use `@solana/wallet-adapter-react` for wallet integration
- Use `@project-serum/anchor` for program interaction
- Use `shadcn/ui` components for UI
- Use Zustand for global state if needed
- WebSocket or polling for real-time updates
