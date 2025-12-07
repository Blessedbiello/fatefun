import {
  Connection,
  Transaction,
  TransactionInstruction,
  PublicKey,
  SendOptions,
  ComputeBudgetProgram,
} from '@solana/web3.js'
import { AnchorWallet } from '@solana/wallet-adapter-react'

export interface TransactionOptions {
  priorityFee?: number // microlamports
  computeUnits?: number
  maxRetries?: number
  confirmationTimeout?: number
}

export interface TransactionResult {
  signature: string
  confirmed: boolean
  error?: Error
}

/**
 * Add priority fee to transaction for faster processing
 */
export function addPriorityFee(
  transaction: Transaction,
  microLamports: number = 10_000 // Default: 0.00001 SOL
): Transaction {
  const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports,
  })

  transaction.add(priorityFeeIx)
  return transaction
}

/**
 * Set compute unit limit for transaction
 */
export function setComputeUnitLimit(
  transaction: Transaction,
  units: number = 200_000 // Default: 200k compute units
): Transaction {
  const computeUnitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units,
  })

  transaction.add(computeUnitIx)
  return transaction
}

/**
 * Send transaction with retries and priority fee
 */
export async function sendTransactionWithRetry(
  connection: Connection,
  transaction: Transaction,
  wallet: AnchorWallet,
  options: TransactionOptions = {}
): Promise<TransactionResult> {
  const {
    priorityFee = 10_000,
    computeUnits = 200_000,
    maxRetries = 3,
    confirmationTimeout = 30000,
  } = options

  // Add priority fee and compute units
  addPriorityFee(transaction, priorityFee)
  setComputeUnitLimit(transaction, computeUnits)

  let lastError: Error | undefined
  let signature: string = ''

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')
      transaction.recentBlockhash = blockhash
      transaction.feePayer = wallet.publicKey

      // Sign transaction
      const signedTx = await wallet.signTransaction(transaction)

      // Send transaction
      signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      console.log(`📤 Transaction sent (attempt ${attempt + 1}/${maxRetries}):`, signature)

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      )

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
      }

      console.log('✅ Transaction confirmed:', signature)

      return {
        signature,
        confirmed: true,
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`❌ Transaction attempt ${attempt + 1} failed:`, lastError.message)

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  return {
    signature,
    confirmed: false,
    error: lastError || new Error('Transaction failed after max retries'),
  }
}

/**
 * Estimate priority fee based on recent transactions
 */
export async function estimatePriorityFee(
  connection: Connection,
  transaction: Transaction
): Promise<number> {
  try {
    // Get recent prioritization fees
    const recentFees = await connection.getRecentPrioritizationFees()

    if (recentFees.length === 0) {
      return 10_000 // Default fallback
    }

    // Calculate average of recent fees
    const avgFee = recentFees.reduce((sum, fee) => sum + fee.prioritizationFee, 0) / recentFees.length

    // Add 20% buffer for better chance of inclusion
    const bufferedFee = Math.ceil(avgFee * 1.2)

    // Cap at reasonable maximum (0.001 SOL = 1,000,000 microlamports)
    return Math.min(bufferedFee, 1_000_000)

  } catch (error) {
    console.error('Failed to estimate priority fee:', error)
    return 10_000 // Fallback
  }
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForConfirmation(
  connection: Connection,
  signature: string,
  timeout: number = 30000,
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
): Promise<boolean> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      const status = await connection.getSignatureStatus(signature)

      if (status?.value?.confirmationStatus === commitment ||
          status?.value?.confirmationStatus === 'finalized') {
        return true
      }

      if (status?.value?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
      }

    } catch (error) {
      console.error('Error checking transaction status:', error)
    }

    // Wait 1 second before next check
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return false
}

/**
 * Simulate transaction before sending
 */
export async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  wallet: AnchorWallet
): Promise<{ success: boolean; logs?: string[]; error?: string }> {
  try {
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = wallet.publicKey

    const signedTx = await wallet.signTransaction(transaction)

    const simulation = await connection.simulateTransaction(signedTx)

    if (simulation.value.err) {
      return {
        success: false,
        error: JSON.stringify(simulation.value.err),
        logs: simulation.value.logs || [],
      }
    }

    return {
      success: true,
      logs: simulation.value.logs || [],
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Simulation failed',
    }
  }
}

/**
 * Build transaction with optimal settings
 */
export async function buildOptimalTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  wallet: AnchorWallet,
  options: TransactionOptions = {}
): Promise<Transaction> {
  const transaction = new Transaction()

  // Add compute budget instructions first
  if (options.computeUnits) {
    setComputeUnitLimit(transaction, options.computeUnits)
  }

  // Estimate or use provided priority fee
  const priorityFee = options.priorityFee || await estimatePriorityFee(connection, transaction)
  addPriorityFee(transaction, priorityFee)

  // Add program instructions
  transaction.add(...instructions)

  // Set recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('finalized')
  transaction.recentBlockhash = blockhash
  transaction.feePayer = wallet.publicKey

  return transaction
}

/**
 * Check if transaction signature exists and is confirmed
 */
export async function isTransactionConfirmed(
  connection: Connection,
  signature: string
): Promise<boolean> {
  try {
    const status = await connection.getSignatureStatus(signature)
    return status?.value?.confirmationStatus === 'confirmed' ||
           status?.value?.confirmationStatus === 'finalized'
  } catch {
    return false
  }
}

/**
 * Get transaction details
 */
export async function getTransactionDetails(
  connection: Connection,
  signature: string
) {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    })

    if (!tx) return null

    return {
      blockTime: tx.blockTime,
      slot: tx.slot,
      meta: tx.meta,
      transaction: tx.transaction,
    }
  } catch (error) {
    console.error('Failed to get transaction details:', error)
    return null
  }
}
