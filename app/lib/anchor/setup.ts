import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorWallet } from '@solana/wallet-adapter-react'

// Import IDLs (these will be generated after building the programs)
// import FateArenaIDL from '../../../programs/fate-protocol/target/idl/fate_arena.json'
// import FateCouncilIDL from '../../../programs/fate-protocol/target/idl/fate_council.json'

export const FATE_ARENA_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID || 'FATEarenaBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump'
)

export const FATE_COUNCIL_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID || 'FATEcouncBVy3Q8xPzRZYVHf8k3J7d5cKqX4mW9sPump'
)

export function getProvider(connection: Connection, wallet: AnchorWallet) {
  return new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'processed',
  })
}

export function getFateArenaProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = getProvider(connection, wallet)
  // Uncomment when IDL is available
  // return new Program(FateArenaIDL as Idl, FATE_ARENA_PROGRAM_ID, provider)
  return null
}

export function getFateCouncilProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = getProvider(connection, wallet)
  // Uncomment when IDL is available
  // return new Program(FateCouncilIDL as Idl, FATE_COUNCIL_PROGRAM_ID, provider)
  return null
}

// PDA helpers
export const ARENA_SEED = Buffer.from('arena')
export const MATCH_SEED = Buffer.from('match')
export const PLAYER_SEED = Buffer.from('player')
export const PREDICTION_SEED = Buffer.from('prediction')
export const VAULT_SEED = Buffer.from('vault')
export const COUNCIL_SEED = Buffer.from('council')
export const PROPOSAL_SEED = Buffer.from('proposal')
export const VOTE_SEED = Buffer.from('vote')

export function findArenaPDA() {
  return PublicKey.findProgramAddressSync([ARENA_SEED], FATE_ARENA_PROGRAM_ID)
}

export function findMatchPDA(matchId: number) {
  const matchIdBuffer = Buffer.alloc(8)
  matchIdBuffer.writeBigUInt64LE(BigInt(matchId))
  return PublicKey.findProgramAddressSync([MATCH_SEED, matchIdBuffer], FATE_ARENA_PROGRAM_ID)
}

export function findPlayerPDA(wallet: PublicKey) {
  return PublicKey.findProgramAddressSync([PLAYER_SEED, wallet.toBuffer()], FATE_ARENA_PROGRAM_ID)
}

export function findPredictionPDA(match: PublicKey, player: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [PREDICTION_SEED, match.toBuffer(), player.toBuffer()],
    FATE_ARENA_PROGRAM_ID
  )
}

export function findVaultPDA(match: PublicKey) {
  return PublicKey.findProgramAddressSync([VAULT_SEED, match.toBuffer()], FATE_ARENA_PROGRAM_ID)
}

export function findCouncilPDA() {
  return PublicKey.findProgramAddressSync([COUNCIL_SEED], FATE_COUNCIL_PROGRAM_ID)
}

export function findProposalPDA(proposalId: number) {
  const proposalIdBuffer = Buffer.alloc(8)
  proposalIdBuffer.writeBigUInt64LE(BigInt(proposalId))
  return PublicKey.findProgramAddressSync([PROPOSAL_SEED, proposalIdBuffer], FATE_COUNCIL_PROGRAM_ID)
}

export function findVotePDA(proposal: PublicKey, voter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [VOTE_SEED, proposal.toBuffer(), voter.toBuffer()],
    FATE_COUNCIL_PROGRAM_ID
  )
}
