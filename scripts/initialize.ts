/**
 * Proper initialization script using Anchor IDL
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FateArena } from "../target/types/fate_arena";
import { FateCouncil } from "../target/types/fate_council";

const NETWORK = process.env.NETWORK || "devnet";
const RPC_URL = "https://api.devnet.solana.com";

// From deployment
const ARENA_PROGRAM_ID = "HRF68UNqq3ASruJFacsBhV7iQyfLF697FhjPCfLNXQxa";
const COUNCIL_PROGRAM_ID = "DnseM3GuRFjz5SxgRMpWGeSubkZZu8TxNrpQYTZVnFvZ";

// Pyth Price Feeds on devnet
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

  // Load programs with IDL
  const arenaProgramId = new PublicKey(ARENA_PROGRAM_ID);
  const councilProgramId = new PublicKey(COUNCIL_PROGRAM_ID);

  const arenaIdl = require("../target/idl/fate_arena.json");
  const councilIdl = require("../target/idl/fate_council.json");

  const arenaProgram = new Program(arenaIdl, arenaProgramId, provider) as Program<FateArena>;
  const councilProgram = new Program(councilIdl, councilProgramId, provider) as Program<FateCouncil>;

  console.log(`📋 Program IDs:`);
  console.log(`   Arena:   ${ARENA_PROGRAM_ID}`);
  console.log(`   Council: ${COUNCIL_PROGRAM_ID}\n`);

  // ===== INITIALIZE ARENA CONFIG =====
  console.log("⚙️  Initializing Arena config...\n");

  const [arenaConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("game-config")],
    arenaProgramId
  );

  try {
    const tx = await arenaProgram.methods
      .initializeConfig({
        protocolFeeBps: 500, // 5%
      })
      .accounts({
        config: arenaConfig,
        authority: wallet.publicKey,
        treasury: wallet.publicKey, // Using wallet as treasury for now
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Arena config initialized");
    console.log(`   Config: ${arenaConfig.toString()}`);
    console.log(`   TX: ${tx}\n`);
  } catch (err: any) {
    if (err.toString().includes("already in use") || err.toString().includes("0x0")) {
      console.log("⚠️  Arena config already initialized\n");
    } else {
      console.error("❌ Arena config initialization failed:", err.message, "\n");
    }
  }

  // ===== INITIALIZE COUNCIL CONFIG =====
  console.log("⚙️  Initializing Council config...\n");

  const [councilConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("council_config")],
    councilProgramId
  );

  try {
    const tx = await councilProgram.methods
      .initializeCouncil({
        fateArenaProgram: arenaProgramId,
        proposalStake: new BN(1 * LAMPORTS_PER_SOL), // 1 SOL
        votingPeriod: new BN(48 * 3600), // 48 hours
        proposerBonusBps: 200, // 2% bonus for proposer if passes
      })
      .accounts({
        config: councilConfig,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Council config initialized");
    console.log(`   Config: ${councilConfig.toString()}`);
    console.log(`   TX: ${tx}\n`);
  } catch (err: any) {
    if (err.toString().includes("already in use") || err.toString().includes("0x0")) {
      console.log("⚠️  Council config already initialized\n");
    } else {
      console.error("❌ Council config initialization failed:", err.message, "\n");
    }
  }

  // ===== CREATE MARKETS =====
  console.log("🏪 Creating markets...\n");

  const markets = [
    { name: "SOL/USD", feed: PYTH_FEEDS["SOL/USD"], desc: "Solana price prediction market" },
    { name: "BTC/USD", feed: PYTH_FEEDS["BTC/USD"], desc: "Bitcoin price prediction market" },
    { name: "ETH/USD", feed: PYTH_FEEDS["ETH/USD"], desc: "Ethereum price prediction market" },
  ];

  // Fetch current config to get total_matches counter (which is used for market IDs)
  const arenaConfigAccount = await arenaProgram.account.gameConfig.fetch(arenaConfig);
  let marketCount = Number(arenaConfigAccount.totalMatches);

  for (const market of markets) {
    try {
      // Get the market PDA - uses total_matches counter with 8-byte LE encoding
      const countBuffer = Buffer.alloc(8);
      countBuffer.writeBigUInt64LE(BigInt(marketCount));
      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), countBuffer],
        arenaProgramId
      );

      const tx = await arenaProgram.methods
        .createMarket({
          name: market.name,
          description: market.desc,
        })
        .accounts({
          config: arenaConfig,
          market: marketPda,
          pythPriceFeed: new PublicKey(market.feed),
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(`✅ Created ${market.name} market`);
      console.log(`   Market: ${marketPda.toString()}`);
      console.log(`   TX: ${tx}\n`);

      marketCount++;
    } catch (err: any) {
      if (err.toString().includes("already in use") || err.toString().includes("0x0")) {
        console.log(`⚠️  ${market.name} market already exists\n`);
        marketCount++;
      } else {
        console.error(`❌ Failed to create ${market.name}:`, err.message, "\n");
      }
    }
  }

  console.log("\n✅ Initialization Complete!\n");
  console.log("📋 Summary:");
  console.log(`   Arena Config: ${arenaConfig.toString()}`);
  console.log(`   Council Config: ${councilConfig.toString()}`);
  console.log(`   Markets: ${marketCount} created`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Initialization failed:");
    console.error(err);
    process.exit(1);
  });
