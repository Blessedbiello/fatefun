/**
 * Transaction utilities for FATE Arena match operations
 */

import { AnchorProvider, BN, Program } from '@coral-xyz/anchor'
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { FateArena } from '@/lib/types/fate_arena'
import { PredictionSide } from '@/types/arena'

/**
 * Ensure user profile exists (calls updateUserProfile with init_if_needed)
 */
async function ensureUserProfile(program: Program<FateArena>) {
  const provider = program.provider as AnchorProvider
  const wallet = provider.wallet

  const [userProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), wallet.publicKey.toBuffer()],
    program.programId
  )

  try {
    // Try to fetch - if it exists, we're good
    await program.account.userProfile.fetch(userProfilePda)
  } catch {
    // Profile doesn't exist, create it via updateUserProfile
    await program.methods
      .updateUserProfile({ username: null })
      .accounts({
        userProfile: userProfilePda,
        user: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
  }
}

/**
 * Create a new match
 */
export async function createMatch(
  program: Program<FateArena>,
  params: {
    marketAddress: PublicKey
    matchType: { flashDuel: {} } | { battleRoyale: {} } | { tournament: {} }
    entryFee: number // in SOL
    maxPlayers: number
    predictionWindow: number // in seconds
    matchDuration: number // duration in seconds (not timestamp!)
  }
) {
  const provider = program.provider as AnchorProvider
  const wallet = provider.wallet

  // Ensure user profile exists before creating match
  await ensureUserProfile(program)

  // Get config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('game-config')],
    program.programId
  )

  // Get next match ID from config (totalMatches is the next ID)
  const config = await program.account.gameConfig.fetch(configPda)
  const matchId = config.totalMatches

  // Derive match PDA
  const [matchPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('match'), matchId.toArrayLike(Buffer, 'le', 8)],
    program.programId
  )

  // Derive player entry PDA
  const [playerEntryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), matchPda.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId
  )

  // Derive user profile PDA
  const [userProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), wallet.publicKey.toBuffer()],
    program.programId
  )

  // Derive vault PDA
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), matchPda.toBuffer()],
    program.programId
  )

  const tx = await program.methods
    .createMatch({
      matchType: params.matchType,
      entryFee: new BN(params.entryFee * LAMPORTS_PER_SOL),
      maxPlayers: params.maxPlayers,
      predictionWindow: new BN(params.predictionWindow),
      matchDuration: new BN(params.matchDuration),
    })
    .accounts({
      config: configPda,
      market: params.marketAddress,
      matchAccount: matchPda,
      playerEntry: playerEntryPda,
      userProfile: userProfilePda,
      vault: vaultPda,
      creator: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return {
    signature: tx,
    matchAddress: matchPda,
    matchId,
  }
}

/**
 * Join an existing match
 */
export async function joinMatch(
  program: Program<FateArena>,
  matchAddress: PublicKey
) {
  const provider = program.provider as AnchorProvider
  const wallet = provider.wallet

  // Ensure user profile exists before joining match
  await ensureUserProfile(program)

  // Derive player entry PDA
  const [playerEntryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), matchAddress.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId
  )

  // Derive user profile PDA
  const [userProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), wallet.publicKey.toBuffer()],
    program.programId
  )

  // Derive vault PDA
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), matchAddress.toBuffer()],
    program.programId
  )

  const tx = await program.methods
    .joinMatch()
    .accounts({
      matchAccount: matchAddress,
      playerEntry: playerEntryPda,
      userProfile: userProfilePda,
      vault: vaultPda,
      player: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return {
    signature: tx,
    playerEntryAddress: playerEntryPda,
  }
}

/**
 * Submit prediction for a match
 */
export async function submitPrediction(
  program: Program<FateArena>,
  params: {
    matchAddress: PublicKey
    marketAddress: PublicKey
    pythPriceFeed: PublicKey
    prediction: 'higher' | 'lower'
  }
) {
  const provider = program.provider as AnchorProvider
  const wallet = provider.wallet

  // Derive player entry PDA
  const [playerEntryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), params.matchAddress.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId
  )

  const predictionSide = params.prediction === 'higher'
    ? { higher: {} }
    : { lower: {} }

  const tx = await program.methods
    .submitPrediction({
      prediction: predictionSide,
    })
    .accounts({
      market: params.marketAddress,
      matchAccount: params.matchAddress,
      playerEntry: playerEntryPda,
      pythPriceFeed: params.pythPriceFeed,
      player: wallet.publicKey,
    })
    .rpc()

  return {
    signature: tx,
    prediction: params.prediction,
  }
}

/**
 * Resolve a match (admin/anyone can call after resolution time)
 */
export async function resolveMatch(
  program: Program<FateArena>,
  params: {
    matchAddress: PublicKey
    marketAddress: PublicKey
    pythPriceFeed: PublicKey
  }
) {
  const provider = program.provider as AnchorProvider
  const wallet = provider.wallet

  // Get config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('game-config')],
    program.programId
  )

  const tx = await program.methods
    .resolveMatch()
    .accounts({
      config: configPda,
      market: params.marketAddress,
      matchAccount: params.matchAddress,
      pythPriceFeed: params.pythPriceFeed,
      resolver: wallet.publicKey,
    })
    .rpc()

  return {
    signature: tx,
  }
}

/**
 * Claim winnings from a completed match
 */
export async function claimWinnings(
  program: Program<FateArena>,
  matchAddress: PublicKey
) {
  const provider = program.provider as AnchorProvider
  const wallet = provider.wallet

  // Get config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('game-config')],
    program.programId
  )

  // Derive player entry PDA
  const [playerEntryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), matchAddress.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId
  )

  // Derive user profile PDA
  const [userProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), wallet.publicKey.toBuffer()],
    program.programId
  )

  // Derive vault PDA
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), matchAddress.toBuffer()],
    program.programId
  )

  // Get config to find treasury
  const config = await program.account.gameConfig.fetch(configPda)

  const tx = await program.methods
    .claimWinnings()
    .accounts({
      config: configPda,
      matchAccount: matchAddress,
      playerEntry: playerEntryPda,
      userProfile: userProfilePda,
      vault: vaultPda,
      treasury: config.treasury,
      player: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return {
    signature: tx,
  }
}

/**
 * Initialize user profile (required before first match)
 */
export async function initializeUserProfile(
  program: Program<FateArena>,
  username?: string
) {
  const provider = program.provider as AnchorProvider
  const wallet = provider.wallet

  // Derive user profile PDA
  const [userProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), wallet.publicKey.toBuffer()],
    program.programId
  )

  const tx = await program.methods
    .initializeProfile({
      username: username || null,
    })
    .accounts({
      userProfile: userProfilePda,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return {
    signature: tx,
    profileAddress: userProfilePda,
  }
}

/**
 * Helper: Check if user has a profile
 */
export async function hasUserProfile(
  program: Program<FateArena>,
  userPublicKey: PublicKey
): Promise<boolean> {
  const [userProfilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), userPublicKey.toBuffer()],
    program.programId
  )

  try {
    await program.account.userProfile.fetch(userProfilePda)
    return true
  } catch {
    return false
  }
}

/**
 * Helper: Get match PDAs
 */
export function getMatchPDAs(
  programId: PublicKey,
  matchId: BN,
  matchAddress?: PublicKey
) {
  const [matchPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('match'), matchId.toArrayLike(Buffer, 'le', 8)],
    programId
  )

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), (matchAddress || matchPda).toBuffer()],
    programId
  )

  return {
    matchPda,
    vaultPda,
  }
}

/**
 * Helper: Get player entry PDA
 */
export function getPlayerEntryPDA(
  programId: PublicKey,
  matchAddress: PublicKey,
  playerPublicKey: PublicKey
) {
  const [playerEntryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), matchAddress.toBuffer(), playerPublicKey.toBuffer()],
    programId
  )

  return playerEntryPda
}
