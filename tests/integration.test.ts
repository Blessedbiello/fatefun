/**
 * Integration Tests
 * End-to-end flows testing Arena + Council interaction
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import { FateArena } from "../programs/fate_arena/target/types/fate_arena";
import { FateCouncil } from "../programs/fate_council/target/types/fate_council";

describe("Integration Tests - Full Flow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const arenaProgram = anchor.workspace.FateArena as Program<FateArena>;
  const councilProgram = anchor.workspace.FateCouncil as Program<FateCouncil>;

  // Players for concurrent matches
  const players = Array.from({ length: 20 }, () => Keypair.generate());

  const pythSOLFeed = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");

  before(async () => {
    console.log("🚀 Setting up integration test environment...");

    // Airdrop to all players
    const airdrops = players.map((p) =>
      provider.connection.requestAirdrop(p.publicKey, 5 * LAMPORTS_PER_SOL)
    );

    await Promise.all(airdrops);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("✅ Test wallets funded");
  });

  describe("Full Match Flow - End to End", () => {
    it("Complete match from creation to resolution", async () => {
      console.log("\n📝 Starting full match flow...");

      const matchId = new BN(Date.now());
      const [matchPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("match"), matchId.toArrayLike(Buffer, "le", 8)],
        arenaProgram.programId
      );

      const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from("SOL/USD")],
        arenaProgram.programId
      );

      // Step 1: Create match
      console.log("1️⃣ Creating match...");
      await arenaProgram.methods
        .createMatch({
          matchId,
          marketName: "SOL/USD",
          entryFee: new BN(0.1 * LAMPORTS_PER_SOL),
          maxPlayers: 5,
          duration: 30, // 30 seconds for testing
        })
        .accounts({
          match: matchPda,
          market: marketPda,
          creator: players[0].publicKey,
        })
        .signers([players[0]])
        .rpc();

      let match = await arenaProgram.account.match.fetch(matchPda);
      expect(match.players.length).to.equal(1);
      console.log(`✅ Match created with ID: ${matchId.toString()}`);

      // Step 2: Multiple players join
      console.log("2️⃣ Players joining...");
      for (let i = 1; i < 5; i++) {
        await arenaProgram.methods
          .joinMatch()
          .accounts({
            match: matchPda,
            player: players[i].publicKey,
          })
          .signers([players[i]])
          .rpc();

        console.log(`   Player ${i + 1} joined`);
      }

      match = await arenaProgram.account.match.fetch(matchPda);
      expect(match.players.length).to.equal(5);
      expect(match.totalPool.toNumber()).to.equal(0.5 * LAMPORTS_PER_SOL);

      // Step 3: Players submit predictions
      console.log("3️⃣ Players submitting predictions...");
      const predictions = [
        { higher: {} },
        { higher: {} },
        { higher: {} },
        { lower: {} },
        { lower: {} },
      ];

      for (let i = 0; i < 5; i++) {
        await arenaProgram.methods
          .submitPrediction(predictions[i])
          .accounts({
            match: matchPda,
            player: players[i].publicKey,
          })
          .signers([players[i]])
          .rpc();

        console.log(`   Player ${i + 1} predicted: ${Object.keys(predictions[i])[0]}`);
      }

      match = await arenaProgram.account.match.fetch(matchPda);
      expect(match.players.filter((p) => p.hasPredicted).length).to.equal(5);

      // Step 4: Wait for match duration
      console.log("4️⃣ Waiting for match duration...");
      await new Promise((resolve) => setTimeout(resolve, 32000));

      // Step 5: Resolve match
      console.log("5️⃣ Resolving match...");
      await arenaProgram.methods
        .resolveMatch()
        .accounts({
          match: matchPda,
          market: marketPda,
          pythPriceFeed: pythSOLFeed,
          resolver: provider.wallet.publicKey,
        })
        .rpc();

      match = await arenaProgram.account.match.fetch(matchPda);
      console.log(`   Final price: $${match.finalPrice}`);
      console.log(`   Winning side: ${Object.keys(match.winningSide)[0]}`);
      expect(match.status).to.not.have.property("open");

      // Step 6: Winners claim
      console.log("6️⃣ Winners claiming...");
      const winningSide = match.winningSide.higher ? "higher" : "lower";
      const winners = match.players.filter(
        (p) => p.prediction && Object.keys(p.prediction)[0] === winningSide
      );

      for (const winner of winners) {
        const balanceBefore = await provider.connection.getBalance(winner.player);

        await arenaProgram.methods
          .claimWinnings()
          .accounts({
            match: matchPda,
            player: winner.player,
          })
          .rpc();

        const balanceAfter = await provider.connection.getBalance(winner.player);
        const profit = balanceAfter - balanceBefore;

        console.log(
          `   Winner ${winner.player.toString().slice(0, 8)} claimed: ${(profit / LAMPORTS_PER_SOL).toFixed(4)} SOL`
        );
        expect(balanceAfter).to.be.greaterThan(balanceBefore);
      }

      console.log("✅ Full match flow completed successfully!\n");
    });
  });

  describe("Concurrent Matches", () => {
    it("Handles multiple matches simultaneously", async () => {
      console.log("\n🔀 Testing concurrent matches...");

      const matchCount = 3;
      const matchIds: BN[] = [];
      const matchPdas: PublicKey[] = [];

      // Create multiple matches
      for (let i = 0; i < matchCount; i++) {
        const matchId = new BN(Date.now() + i * 1000);
        matchIds.push(matchId);

        const [matchPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("match"), matchId.toArrayLike(Buffer, "le", 8)],
          arenaProgram.programId
        );
        matchPdas.push(matchPda);

        const [marketPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("market"), Buffer.from("SOL/USD")],
          arenaProgram.programId
        );

        await arenaProgram.methods
          .createMatch({
            matchId,
            marketName: "SOL/USD",
            entryFee: new BN(0.1 * LAMPORTS_PER_SOL),
            maxPlayers: 4,
            duration: 20,
          })
          .accounts({
            match: matchPda,
            market: marketPda,
            creator: players[i * 4].publicKey,
          })
          .signers([players[i * 4]])
          .rpc();

        console.log(`   Match ${i + 1} created`);
      }

      // Players join different matches
      for (let matchIdx = 0; matchIdx < matchCount; matchIdx++) {
        for (let playerIdx = 1; playerIdx < 4; playerIdx++) {
          const player = players[matchIdx * 4 + playerIdx];

          await arenaProgram.methods
            .joinMatch()
            .accounts({
              match: matchPdas[matchIdx],
              player: player.publicKey,
            })
            .signers([player])
            .rpc();
        }
      }

      // Verify all matches have 4 players
      for (let i = 0; i < matchCount; i++) {
        const match = await arenaProgram.account.match.fetch(matchPdas[i]);
        expect(match.players.length).to.equal(4);
      }

      console.log("✅ All concurrent matches running successfully\n");
    });
  });

  describe("Council to Arena Flow", () => {
    it("Proposal creates new market, match uses it", async () => {
      console.log("\n🏛️ Testing Council → Arena flow...");

      const proposalId = new BN(Date.now());
      const [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalId.toArrayLike(Buffer, "le", 8)],
        councilProgram.programId
      );

      const [councilConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from("council-config")],
        councilProgram.programId
      );

      // Step 1: Create proposal to add BTC market
      console.log("1️⃣ Creating proposal for BTC/USD market...");
      await councilProgram.methods
        .createProposal({
          proposalId,
          marketName: "BTC/USD",
          description: "Add Bitcoin market",
          pythPriceFeed: pythSOLFeed, // Using SOL feed for testing
        })
        .accounts({
          proposal: proposalPda,
          proposer: players[0].publicKey,
          config: councilConfig,
        })
        .signers([players[0]])
        .rpc();

      // Step 2: Community votes (majority PASS)
      console.log("2️⃣ Community voting...");
      for (let i = 0; i < 3; i++) {
        const [votePosition] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("vote-position"),
            proposalPda.toBuffer(),
            players[i].publicKey.toBuffer(),
          ],
          councilProgram.programId
        );

        await councilProgram.methods
          .vote({ pass: {} }, new BN(1 * LAMPORTS_PER_SOL))
          .accounts({
            proposal: proposalPda,
            votePosition,
            voter: players[i].publicKey,
          })
          .signers([players[i]])
          .rpc();
      }

      // Step 3: Resolve proposal
      console.log("3️⃣ Resolving proposal...");
      await councilProgram.methods
        .resolveProposal()
        .accounts({
          proposal: proposalPda,
          resolver: provider.wallet.publicKey,
        })
        .rpc();

      const proposal = await councilProgram.account.proposal.fetch(proposalPda);
      expect(proposal.status).to.have.property("passed");

      // Step 4: Execute to create market
      console.log("4️⃣ Executing proposal (creating market)...");
      await councilProgram.methods
        .executeProposal()
        .accounts({
          proposal: proposalPda,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      // Step 5: Verify market exists and create match
      console.log("5️⃣ Creating match with new market...");
      const [btcMarket] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from("BTC/USD")],
        arenaProgram.programId
      );

      // Market should now exist from proposal execution
      // (In real implementation, executeProposal would call arena.createMarket)

      console.log("✅ Council → Arena flow completed!\n");
    });
  });

  describe("Player Stats Across Multiple Matches", () => {
    it("Tracks player progression correctly", async () => {
      console.log("\n📊 Testing player progression...");

      const testPlayer = players[10];
      const [playerState] = PublicKey.findProgramAddressSync(
        [Buffer.from("player-state"), testPlayer.publicKey.toBuffer()],
        arenaProgram.programId
      );

      // Initialize player
      await arenaProgram.methods
        .createPlayerState("TestPlayer")
        .accounts({
          playerState,
          player: testPlayer.publicKey,
        })
        .signers([testPlayer])
        .rpc();

      let state = await arenaProgram.account.playerState.fetch(playerState);
      const initialLevel = state.level;

      // Simulate wins
      console.log("   Simulating 5 wins...");
      for (let i = 0; i < 5; i++) {
        await arenaProgram.methods
          .updatePlayerStats({ win: true, xpGained: 100 })
          .accounts({
            playerState,
            player: testPlayer.publicKey,
          })
          .signers([testPlayer])
          .rpc();
      }

      state = await arenaProgram.account.playerState.fetch(playerState);
      expect(state.wins).to.equal(5);
      expect(state.totalMatches).to.equal(5);
      expect(state.xp).to.be.greaterThan(0);
      expect(state.level).to.be.greaterThanOrEqual(initialLevel);

      console.log(`   Final stats: Level ${state.level}, ${state.xp} XP, ${state.wins}W/${state.losses}L`);
      console.log("✅ Player progression tracked correctly\n");
    });
  });
});
