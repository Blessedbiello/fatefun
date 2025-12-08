/**
 * Deployment Script
 * Deploys programs and initializes configs on devnet/mainnet
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const NETWORK = process.env.NETWORK || "devnet";
const RPC_URL =
  NETWORK === "mainnet"
    ? process.env.MAINNET_RPC_URL
    : "https://api.devnet.solana.com";

// Pyth Price Feeds
const PYTH_FEEDS = {
  devnet: {
    "SOL/USD": "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix",
    "BTC/USD": "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J",
    "ETH/USD": "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw",
  },
  mainnet: {
    "SOL/USD": "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
    "BTC/USD": "GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU",
    "ETH/USD": "JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB",
  },
};

async function main() {
  console.log(`🚀 Deploying FATE Protocol to ${NETWORK}...\n`);

  // Setup provider
  const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  console.log(`📡 Connected to: ${RPC_URL}`);
  console.log(`🔑 Deployer: ${wallet.publicKey.toString()}\n`);

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  if (balance < 10 * LAMPORTS_PER_SOL) {
    console.error("❌ Insufficient balance. Need at least 10 SOL for deployment.");
    if (NETWORK === "devnet") {
      console.log("💡 Run: solana airdrop 10");
    }
    process.exit(1);
  }

  console.log("\n📦 Step 1: Building programs...");
  try {
    execSync("anchor build", { stdio: "inherit", cwd: process.cwd() });
    console.log("✅ Programs built successfully");
  } catch (err) {
    console.error("❌ Build failed:", err);
    process.exit(1);
  }

  console.log("\n🚢 Step 2: Deploying programs...");
  try {
    const cluster = NETWORK === "mainnet" ? "mainnet-beta" : "devnet";
    execSync(`anchor deploy --provider.cluster ${cluster}`, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log("✅ Programs deployed successfully");
  } catch (err) {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  }

  // Load program IDs
  const arenaIdl = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../target/idl/fate_arena.json"),
      "utf-8"
    )
  );
  const councilIdl = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../target/idl/fate_council.json"),
      "utf-8"
    )
  );

  const arenaProgramId = new PublicKey(arenaIdl.metadata.address);
  const councilProgramId = new PublicKey(councilIdl.metadata.address);

  console.log(`\n📋 Program IDs:`);
  console.log(`   Arena:   ${arenaProgramId.toString()}`);
  console.log(`   Council: ${councilProgramId.toString()}`);

  const arenaProgram = new Program(arenaIdl, arenaProgramId, provider);
  const councilProgram = new Program(councilIdl, councilProgramId, provider);

  console.log("\n⚙️  Step 3: Initializing configs...");

  // Initialize Arena Config
  const [arenaConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("arena-config")],
    arenaProgramId
  );

  try {
    await arenaProgram.methods
      .initializeConfig({
        protocolFeeBps: 500, // 5%
        minEntryFee: new BN(0.01 * LAMPORTS_PER_SOL),
        maxEntryFee: new BN(100 * LAMPORTS_PER_SOL),
        minDuration: 60,
        maxDuration: 3600,
      })
      .accounts({
        config: arenaConfig,
        authority: wallet.publicKey,
      })
      .rpc();

    console.log("✅ Arena config initialized");
  } catch (err: any) {
    if (err.toString().includes("already in use")) {
      console.log("⚠️  Arena config already initialized");
    } else {
      console.error("❌ Arena config initialization failed:", err);
    }
  }

  // Initialize Council Config
  const [councilConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("council-config")],
    councilProgramId
  );

  try {
    await councilProgram.methods
      .initializeCouncil({
        proposalStake: new BN(1 * LAMPORTS_PER_SOL),
        minVote: new BN(0.1 * LAMPORTS_PER_SOL),
        votingPeriod: 86400, // 24 hours
      })
      .accounts({
        config: councilConfig,
        authority: wallet.publicKey,
      })
      .rpc();

    console.log("✅ Council config initialized");
  } catch (err: any) {
    if (err.toString().includes("already in use")) {
      console.log("⚠️  Council config already initialized");
    } else {
      console.error("❌ Council config initialization failed:", err);
    }
  }

  console.log("\n🏪 Step 4: Creating initial markets...");

  const markets = ["SOL/USD", "BTC/USD", "ETH/USD"];
  const pythFeeds = PYTH_FEEDS[NETWORK as keyof typeof PYTH_FEEDS];

  for (const marketName of markets) {
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(marketName)],
      arenaProgramId
    );

    const pythFeed = new PublicKey(pythFeeds[marketName as keyof typeof pythFeeds]);

    try {
      await arenaProgram.methods
        .createMarket(marketName)
        .accounts({
          market: marketPda,
          pythPriceFeed: pythFeed,
          authority: wallet.publicKey,
        })
        .rpc();

      console.log(`   ✅ Created ${marketName} market`);
    } catch (err: any) {
      if (err.toString().includes("already in use")) {
        console.log(`   ⚠️  ${marketName} market already exists`);
      } else {
        console.error(`   ❌ Failed to create ${marketName}:`, err.message);
      }
    }
  }

  console.log("\n✅ Step 5: Verifying deployment...");

  // Verify configs
  try {
    const arenaConfigAccount = await arenaProgram.account.arenaConfig.fetch(arenaConfig);
    console.log(`   ✅ Arena config verified (fee: ${arenaConfigAccount.protocolFeeBps} bps)`);
  } catch (err) {
    console.error("   ❌ Arena config verification failed");
  }

  try {
    const councilConfigAccount = await councilProgram.account.councilConfig.fetch(councilConfig);
    console.log(
      `   ✅ Council config verified (stake: ${(Number(councilConfigAccount.proposalStake) / LAMPORTS_PER_SOL).toFixed(2)} SOL)`
    );
  } catch (err) {
    console.error("   ❌ Council config verification failed");
  }

  // Verify markets
  for (const marketName of markets) {
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(marketName)],
      arenaProgramId
    );

    try {
      const market = await arenaProgram.account.market.fetch(marketPda);
      console.log(`   ✅ ${marketName} market verified (active: ${market.isActive})`);
    } catch (err) {
      console.log(`   ⚠️  ${marketName} market not found`);
    }
  }

  console.log("\n📝 Step 6: Generating deployment info...");

  const deploymentInfo = {
    network: NETWORK,
    timestamp: new Date().toISOString(),
    programs: {
      arena: arenaProgramId.toString(),
      council: councilProgramId.toString(),
    },
    config: {
      arenaConfig: arenaConfig.toString(),
      councilConfig: councilConfig.toString(),
    },
    markets: markets.map((name) => ({
      name,
      pda: PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from(name)],
        arenaProgramId
      )[0].toString(),
      pythFeed: pythFeeds[name as keyof typeof pythFeeds],
    })),
    deployer: wallet.publicKey.toString(),
  };

  const outputPath = path.join(__dirname, `../deployment-${NETWORK}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`   ✅ Deployment info saved to ${outputPath}`);

  console.log("\n🎉 Deployment Complete!");
  console.log("\n📋 Next Steps:");
  console.log(`   1. Update .env.${NETWORK} with program IDs`);
  console.log("   2. Update frontend environment variables");
  console.log("   3. Test with: npm run test:integration");
  console.log("   4. Deploy frontend to Vercel");

  console.log("\n🔗 Useful Commands:");
  console.log(`   solana program show ${arenaProgramId.toString()}`);
  console.log(`   solana account ${arenaConfig.toString()}`);
  console.log(`   anchor test --provider.cluster ${NETWORK === "mainnet" ? "mainnet-beta" : "devnet"}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Deployment failed:");
    console.error(err);
    process.exit(1);
  });
