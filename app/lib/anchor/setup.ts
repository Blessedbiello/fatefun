import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorWallet } from '@solana/wallet-adapter-react'

// Import IDLs and Types
import FateArenaIDLJson from '../idl/fate_arena.json'
import FateCouncilIDLJson from '../idl/fate_council.json'
import type { FateArena } from '../types/fate_arena'
import type { FateCouncil } from '../types/fate_council'

// Convert JSON to Idl type (Anchor 0.29.0 IDLs don't have address/metadata fields)
const FateArenaIDL = FateArenaIDLJson as unknown as Idl
const FateCouncilIDL = FateCouncilIDLJson as unknown as Idl

// Program IDs from environment
export const FATE_ARENA_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID || 'HRF68UNqq3ASruJFacsBhV7iQyfLF697FhjPCfLNXQxa'
)

export const FATE_COUNCIL_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID || 'DnseM3GuRFjz5SxgRMpWGeSubkZZu8TxNrpQYTZVnFvZ'
)

// Initialized Config Accounts
export const ARENA_CONFIG = new PublicKey(
  process.env.NEXT_PUBLIC_ARENA_CONFIG || 'AFJNPNJNHamY9okuXJCtnPtYJDmd7Hftnv2Au4VyTrzf'
)

export const COUNCIL_CONFIG = new PublicKey(
  process.env.NEXT_PUBLIC_COUNCIL_CONFIG || '9mBNbhcKfrQUCNzsLeVDMsnPLuLM8kSPwPjjxNUrxtES'
)

// Market Addresses
export const MARKETS = {
  'SOL/USD': new PublicKey(process.env.NEXT_PUBLIC_MARKET_SOL_USD || '3WELCbU716g1uyMtQuuPDv2BivqEH2zDJ9hbLHqYAHKB'),
  'BTC/USD': new PublicKey(process.env.NEXT_PUBLIC_MARKET_BTC_USD || 'Bj4h6S47ubb3BpAGuZLh16uUsPRWUFk7iixN6o5Vih7G'),
  'ETH/USD': new PublicKey(process.env.NEXT_PUBLIC_MARKET_ETH_USD || 'FMgsZnLu8KzoFq5SFLx7PfHEfLrVQCmb71fXzLWUYmkC'),
}

export function getProvider(connection: Connection, wallet: AnchorWallet) {
  return new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'processed',
  })
}

export function getFateArenaProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = getProvider(connection, wallet)
  console.log('[Anchor Setup] Creating Program with IDL:', {
    version: (FateArenaIDL as any).version,
    hasMetadata: 'metadata' in FateArenaIDL,
    hasAddress: 'address' in FateArenaIDL
  })
  return new Program(FateArenaIDL, FATE_ARENA_PROGRAM_ID, provider) as unknown as Program<FateArena>
}

export function getFateCouncilProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = getProvider(connection, wallet)
  return new Program(FateCouncilIDL, FATE_COUNCIL_PROGRAM_ID, provider) as unknown as Program<FateCouncil>
}

// ===== PDA Helpers (Updated to match actual program seeds) =====

// Arena Config PDA
export function findArenaConfigPDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('game-config')],
    FATE_ARENA_PROGRAM_ID
  )
}

// Market PDA - uses total_matches counter as market ID
export function findMarketPDA(marketId: number) {
  const idBuffer = Buffer.alloc(8)
  idBuffer.writeBigUInt64LE(BigInt(marketId))
  return PublicKey.findProgramAddressSync(
    [Buffer.from('market'), idBuffer],
    FATE_ARENA_PROGRAM_ID
  )
}

// Match PDA
export function findMatchPDA(matchId: number) {
  const idBuffer = Buffer.alloc(8)
  idBuffer.writeBigUInt64LE(BigInt(matchId))
  return PublicKey.findProgramAddressSync(
    [Buffer.from('match'), idBuffer],
    FATE_ARENA_PROGRAM_ID
  )
}

// Player Entry PDA
export function findPlayerEntryPDA(match: PublicKey, player: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), match.toBuffer(), player.toBuffer()],
    FATE_ARENA_PROGRAM_ID
  )
}

// User Profile PDA
export function findUserProfilePDA(user: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), user.toBuffer()],
    FATE_ARENA_PROGRAM_ID
  )
}

// Match Vault PDA
export function findVaultPDA(match: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), match.toBuffer()],
    FATE_ARENA_PROGRAM_ID
  )
}

// Council Config PDA
export function findCouncilConfigPDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('council_config')],
    FATE_COUNCIL_PROGRAM_ID
  )
}

// Proposal PDA
export function findProposalPDA(proposalId: number) {
  const idBuffer = Buffer.alloc(8)
  idBuffer.writeBigUInt64LE(BigInt(proposalId))
  return PublicKey.findProgramAddressSync(
    [Buffer.from('proposal'), idBuffer],
    FATE_COUNCIL_PROGRAM_ID
  )
}

// Vote PDA
export function findVotePDA(proposal: PublicKey, voter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), proposal.toBuffer(), voter.toBuffer()],
    FATE_COUNCIL_PROGRAM_ID
  )
}

// Vote Escrow PDA
export function findVoteEscrowPDA(proposal: PublicKey, voter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vote-escrow'), proposal.toBuffer(), voter.toBuffer()],
    FATE_COUNCIL_PROGRAM_ID
  )
}
