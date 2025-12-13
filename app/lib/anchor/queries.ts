/**
 * Blockchain query utilities for fetching match and proposal data
 */

import { Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { FateArena } from '@/lib/types/fate_arena'
import { FateCouncil } from '@/lib/types/fate_council'
import { Match, MatchAccount, PlayerEntry } from '@/types/arena'
import { enhanceMatchData } from '@/lib/utils/matchTransform'

/**
 * Fetch all matches from the blockchain
 */
export async function fetchEnhancedMatches(
  program: Program<FateArena>,
  limit: number = 100
): Promise<Match[]> {
  try {
    // Fetch all match accounts (IDL account name "Match" = lowercase "match")
    const matchAccounts = await program.account.match.all()

    console.log(`[Queries] Fetched ${matchAccounts.length} matches from blockchain`)

    // Transform each match to the enhanced format
    const enhancedMatches: Match[] = matchAccounts.map((matchAccount) => {
      const match = matchAccount.account as unknown as MatchAccount

      return enhanceMatchData(match, matchAccount.publicKey, {
        marketName: 'SOL/USD',
        marketId: 1,
      })
    })

    return enhancedMatches.slice(0, limit)
  } catch (error) {
    console.error('[Queries] Error fetching matches:', error)
    return []
  }
}

/**
 * Fetch a single match by address
 */
export async function fetchEnhancedMatch(
  program: Program<FateArena>,
  matchAddress: PublicKey
): Promise<Match | null> {
  try {
    const matchAccount = await program.account.match.fetch(matchAddress)
    const match = matchAccount as unknown as MatchAccount

    // Fetch players in this match
    const players = await fetchPlayersInMatch(program, matchAddress)

    return enhanceMatchData(match, matchAddress, {
      marketName: 'SOL/USD',
      marketId: 1,
      players: players.map(p => p.account),
    })
  } catch (error) {
    console.error('[Queries] Error fetching match:', error)
    return null
  }
}

/**
 * Fetch all player entries for a specific match
 */
export async function fetchPlayersInMatch(
  program: Program<FateArena>,
  matchAddress: PublicKey
): Promise<{ publicKey: PublicKey; account: PlayerEntry }[]> {
  try {
    const allPlayerEntries = await program.account.playerEntry.all()

    const matchPlayers = allPlayerEntries.filter((entry) => {
      return entry.account.matchAccount.equals(matchAddress)
    })

    return matchPlayers.map((entry) => ({
      publicKey: entry.publicKey,
      account: entry.account as unknown as PlayerEntry,
    }))
  } catch (error) {
    console.error('[Queries] Error fetching players:', error)
    return []
  }
}

/**
 * Fetch all proposals from FATE Council
 */
export async function fetchAllProposals(
  program: Program<FateCouncil>,
  limit: number = 100
) {
  try {
    const proposals = await program.account.proposal.all()
    console.log(`[Queries] Fetched ${proposals.length} proposals from blockchain`)
    return proposals.slice(0, limit)
  } catch (error) {
    console.error('[Queries] Error fetching proposals:', error)
    return []
  }
}
