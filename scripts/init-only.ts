/**
 * Simple initialization script for already-deployed programs
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const NETWORK = process.env.NETWORK || "devnet";
const RPC_URL = "https://api.devnet.solana.com";

// From deployment-devnet.json
const ARENA_PROGRAM_ID = "HRF68UNqq3ASruJFacsBhV7iQyfLF697FhjPCfLNXQxa";
const COUNCIL_PROGRAM_ID = "DnseM3GuRFjz5SxgRMpWGeSubkZZu8TxNrpQYTZVnFvZ";

// Pyth Price Feeds
const PYTH_FEEDS = {
  "SOL/USD": "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix",
  "BTC/USD": "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J",
  "ETH/USD": "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw",
};

async function main() {
  console.log(`🚀 Initializing FATE Protocol on ${NETWORK}...\n`);

  // Setup provider
  const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  console.log(`📡 Connected to: ${RPC_URL}`);
  console.log(`🔑 Wallet: ${wallet.publicKey.toString()}\n`);

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL\n`);

  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.error("❌ Insufficient balance. Need at least 0.5 SOL.");
    process.exit(1);
  }

  const arenaProgramId = new PublicKey(ARENA_PROGRAM_ID);
  const councilProgramId = new PublicKey(COUNCIL_PROGRAM_ID);

  console.log(`📋 Program IDs:`);
  console.log(`   Arena:   ${ARENA_PROGRAM_ID}`);
  console.log(`   Council: ${COUNCIL_PROGRAM_ID}\n`);

  console.log("⚙️  Initializing configs...\n");

  // Initialize Arena Config
  const [arenaConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("arena-config")],
    arenaProgramId
  );

  try {
    const tx = await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        new anchor.web3.TransactionInstruction({
          keys: [
            { pubkey: arenaConfig, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: arenaProgramId,
          data: Buffer.from([
            // initialize_config discriminator (first 8 bytes of sha256("global:initialize_config"))
            ...new BN(500).toArray("le", 8), // protocolFeeBps: 500 (5%)
            ...new BN(0.01 * LAMPORTS_PER_SOL).toArray("le", 8), // minEntryFee
            ...new BN(100 * LAMPORTS_PER_SOL).toArray("le", 8), // maxEntryFee
            ...new BN(60).toArray("le", 8), // minDuration
            ...new BN(3600).toArray("le", 8), // maxDuration
          ]),
        })
      )
    );
    console.log("✅ Arena config initialized");
    console.log(`   TX: ${tx}`);
  } catch (err: any) {
    if (err.toString().includes("already in use") || err.toString().includes("0x0")) {
      console.log("⚠️  Arena config already initialized");
    } else {
      console.error("❌ Arena config initialization failed:", err.message);
    }
  }

  // Initialize Council Config
  const [councilConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("council-config")],
    councilProgramId
  );

  try {
    const tx = await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        new anchor.web3.TransactionInstruction({
          keys: [
            { pubkey: councilConfig, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: councilProgramId,
          data: Buffer.from([
            ...new BN(1 * LAMPORTS_PER_SOL).toArray("le", 8), // proposalStake
            ...new BN(0.1 * LAMPORTS_PER_SOL).toArray("le", 8), // minVote
            ...new BN(86400).toArray("le", 8), // votingPeriod (24 hours)
          ]),
        })
      )
    );
    console.log("✅ Council config initialized");
    console.log(`   TX: ${tx}`);
  } catch (err: any) {
    if (err.toString().includes("already in use") || err.toString().includes("0x0")) {
      console.log("⚠️  Council config already initialized");
    } else {
      console.error("❌ Council config initialization failed:", err.message);
    }
  }

  console.log("\n🏪 Creating markets...\n");

  const markets = ["SOL/USD", "BTC/USD", "ETH/USD"];

  for (const marketName of markets) {
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(marketName)],
      arenaProgramId
    );

    const pythFeed = new PublicKey(PYTH_FEEDS[marketName as keyof typeof PYTH_FEEDS]);

    try {
      const tx = await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          new anchor.web3.TransactionInstruction({
            keys: [
              { pubkey: marketPda, isSigner: false, isWritable: true },
              { pubkey: pythFeed, isSigner: false, isWritable: false },
              { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
              { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            programId: arenaProgramId,
            data: Buffer.concat([
              Buffer.from([0]), // Discriminator for create_market
              Buffer.from([marketName.length]),
              Buffer.from(marketName),
            ]),
          })
        )
      );
      console.log(`✅ Created ${marketName} market`);
      console.log(`   TX: ${tx}`);
    } catch (err: any) {
      if (err.toString().includes("already in use") || err.toString().includes("0x0")) {
        console.log(`⚠️  ${marketName} market already exists`);
      } else {
        console.error(`❌ Failed to create ${marketName}:`, err.message);
      }
    }
  }

  console.log("\n✅ Initialization Complete!");
  console.log("\n📋 Summary:");
  console.log(`   Arena Config: ${arenaConfig.toString()}`);
  console.log(`   Council Config: ${councilConfig.toString()}`);
  console.log(`   Markets: ${markets.length} created`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Initialization failed:");
    console.error(err);
    process.exit(1);
  });
