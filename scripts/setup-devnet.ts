/**
 * Devnet Setup Script
 * Airdrops SOL, creates test matches, simulates activity
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

async function main() {
  console.log("🧪 Setting up devnet test environment...\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;

  console.log(`📡 Connected to: ${connection.rpcEndpoint}`);
  console.log(`🔑 Wallet: ${wallet.publicKey.toString()}\n`);

  // Load program
  const programId = new PublicKey(process.env.NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID!);
  const idl = await Program.fetchIdl(programId, provider);
  const program = new Program(idl!, provider);

  // Create test wallets
  console.log("👥 Creating test wallets...");
  const testWallets = Array.from({ length: 10 }, () => Keypair.generate());

  // Airdrop to test wallets
  console.log("💰 Airdropping SOL to test wallets...");
  for (let i = 0; i < testWallets.length; i++) {
    try {
      const sig = await connection.requestAirdrop(
        testWallets[i].publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig);
      console.log(`   ✅ Wallet ${i + 1}: ${testWallets[i].publicKey.toString().slice(0, 8)}... (2 SOL)`);
    } catch (err) {
      console.log(`   ⚠️  Airdrop rate limited for wallet ${i + 1}, skipping...`);
    }

    // Rate limit
    if (i < testWallets.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log("\n🎮 Creating test matches...");

  const markets = ["SOL/USD", "BTC/USD", "ETH/USD"];
  const matchCount = 3;

  for (let i = 0; i < matchCount; i++) {
    const matchId = new BN(Date.now() + i * 1000);
    const marketName = markets[i % markets.length];

    const [matchPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), matchId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(marketName)],
      program.programId
    );

    try {
      await program.methods
        .createMatch({
          matchId,
          marketName,
          entryFee: new BN(0.1 * LAMPORTS_PER_SOL),
          maxPlayers: 5,
          duration: 300,
        })
        .accounts({
          match: matchPda,
          market: marketPda,
          creator: testWallets[i].publicKey,
        })
        .signers([testWallets[i]])
        .rpc();

      console.log(`   ✅ Match ${i + 1} created: ${marketName} (ID: ${matchId.toString().slice(0, 8)}...)`);

      // Add some players
      const playerCount = Math.min(3, testWallets.length - matchCount);
      for (let j = 0; j < playerCount; j++) {
        const player = testWallets[matchCount + i * playerCount + j];

        try {
          await program.methods
            .joinMatch()
            .accounts({
              match: matchPda,
              player: player.publicKey,
            })
            .signers([player])
            .rpc();

          console.log(`      👤 Player joined: ${player.publicKey.toString().slice(0, 8)}...`);
        } catch (err) {
          console.log(`      ⚠️  Player join failed`);
        }
      }
    } catch (err: any) {
      console.log(`   ❌ Match creation failed: ${err.message}`);
    }
  }

  console.log("\n📊 Creating test player profiles...");

  for (let i = 0; i < 5; i++) {
    const [playerState] = PublicKey.findProgramAddressSync(
      [Buffer.from("player-state"), testWallets[i].publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .createPlayerState(`TestPlayer${i + 1}`)
        .accounts({
          playerState,
          player: testWallets[i].publicKey,
        })
        .signers([testWallets[i]])
        .rpc();

      // Simulate some wins
      const wins = Math.floor(Math.random() * 10) + 1;
      for (let w = 0; w < wins; w++) {
        await program.methods
          .updatePlayerStats({ win: true, xpGained: 100 })
          .accounts({
            playerState,
            player: testWallets[i].publicKey,
          })
          .signers([testWallets[i]])
          .rpc();
      }

      console.log(`   ✅ Player profile created: TestPlayer${i + 1} (${wins} wins)`);
    } catch (err) {
      console.log(`   ⚠️  Player profile creation failed`);
    }
  }

  console.log("\n✅ Devnet setup complete!");
  console.log("\n📝 Test Wallet Keys (save for testing):");
  testWallets.slice(0, 3).forEach((wallet, i) => {
    console.log(`   Wallet ${i + 1}: ${wallet.publicKey.toString()}`);
    console.log(`   Secret: [${wallet.secretKey.toString()}]`);
  });

  console.log("\n🔗 Useful Commands:");
  console.log("   solana balance", testWallets[0].publicKey.toString());
  console.log("   solana account", testWallets[0].publicKey.toString());
  console.log("\n🌐 Test on frontend: http://localhost:3000/arena");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Setup failed:", err);
    process.exit(1);
  });
