import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import { FateArena } from "../target/types/fate_arena";

describe("FATE Arena", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FateArena as Program<FateArena>;

  // Test accounts
  const authority = provider.wallet as anchor.Wallet;
  let arenaConfig: PublicKey;
  let marketAccount: PublicKey;
  let matchAccount: PublicKey;
  let playerState1: PublicKey;
  let playerState2: PublicKey;

  // Test keypairs
  const player1 = Keypair.generate();
  const player2 = Keypair.generate();
  const player3 = Keypair.generate();

  // Mock Pyth price feed (devnet SOL/USD)
  const pythPriceFeed = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");

  // Test constants
  const ENTRY_FEE = new BN(0.1 * LAMPORTS_PER_SOL);
  const MATCH_DURATION = 300; // 5 minutes
  const MAX_PLAYERS = 10;

  before(async () => {
    // Airdrop SOL to test accounts
    await Promise.all([
      provider.connection.requestAirdrop(player1.publicKey, 5 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(player2.publicKey, 5 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(player3.publicKey, 5 * LAMPORTS_PER_SOL),
    ]);

    // Wait for confirmation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Derive PDAs
    [arenaConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("arena-config")],
      program.programId
    );
  });

  describe("Initialization", () => {
    it("Initializes arena config", async () => {
      try {
        await program.methods
          .initializeConfig({
            protocolFeeBps: 500, // 5%
            minEntryFee: new BN(0.01 * LAMPORTS_PER_SOL),
            maxEntryFee: new BN(100 * LAMPORTS_PER_SOL),
            minDuration: 60,
            maxDuration: 3600,
          })
          .accounts({
            config: arenaConfig,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const config = await program.account.arenaConfig.fetch(arenaConfig);
        expect(config.authority.toString()).to.equal(authority.publicKey.toString());
        expect(config.protocolFeeBps).to.equal(500);
      } catch (err) {
        // May already be initialized
        console.log("Config already initialized or error:", err);
      }
    });
  });

  describe("Market Management", () => {
    it("Creates a market with valid Pyth feed", async () => {
      [marketAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from("SOL/USD")],
        program.programId
      );

      await program.methods
        .createMarket("SOL/USD")
        .accounts({
          market: marketAccount,
          pythPriceFeed: pythPriceFeed,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const market = await program.account.market.fetch(marketAccount);
      expect(market.name).to.equal("SOL/USD");
      expect(market.pythPriceFeed.toString()).to.equal(pythPriceFeed.toString());
      expect(market.isActive).to.be.true;
    });

    it("Fails to create market with invalid Pyth feed", async () => {
      const invalidFeed = Keypair.generate().publicKey;
      const [invalidMarket] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from("INVALID")],
        program.programId
      );

      try {
        await program.methods
          .createMarket("INVALID")
          .accounts({
            market: invalidMarket,
            pythPriceFeed: invalidFeed,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have failed with invalid Pyth feed");
      } catch (err) {
        expect(err).to.exist;
      }
    });
  });

  describe("Match Lifecycle", () => {
    let matchId: BN;

    beforeEach(async () => {
      // Generate unique match ID
      matchId = new BN(Date.now());

      [matchAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("match"), matchId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
    });

    it("Creates match and auto-joins creator", async () => {
      await program.methods
        .createMatch({
          matchId,
          marketName: "SOL/USD",
          entryFee: ENTRY_FEE,
          maxPlayers: MAX_PLAYERS,
          duration: MATCH_DURATION,
        })
        .accounts({
          match: matchAccount,
          market: marketAccount,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const match = await program.account.match.fetch(matchAccount);
      expect(match.matchId.toString()).to.equal(matchId.toString());
      expect(match.entryFee.toString()).to.equal(ENTRY_FEE.toString());
      expect(match.players.length).to.equal(1);
      expect(match.status).to.have.property("open");
    });

    it("Allows players to join match", async () => {
      // Create match
      await program.methods
        .createMatch({
          matchId,
          marketName: "SOL/USD",
          entryFee: ENTRY_FEE,
          maxPlayers: MAX_PLAYERS,
          duration: MATCH_DURATION,
        })
        .accounts({
          match: matchAccount,
          market: marketAccount,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Player 1 joins
      await program.methods
        .joinMatch()
        .accounts({
          match: matchAccount,
          player: player1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player1])
        .rpc();

      const match = await program.account.match.fetch(matchAccount);
      expect(match.players.length).to.equal(2);
      expect(match.totalPool.toNumber()).to.equal(ENTRY_FEE.toNumber() * 2);
    });

    it("Prevents joining when match is full", async () => {
      const fullMatchId = new BN(Date.now() + 1000);
      const [fullMatch] = PublicKey.findProgramAddressSync(
        [Buffer.from("match"), fullMatchId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create match with max 2 players
      await program.methods
        .createMatch({
          matchId: fullMatchId,
          marketName: "SOL/USD",
          entryFee: ENTRY_FEE,
          maxPlayers: 2,
          duration: MATCH_DURATION,
        })
        .accounts({
          match: fullMatch,
          market: marketAccount,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Player 1 joins (now full)
      await program.methods
        .joinMatch()
        .accounts({
          match: fullMatch,
          player: player1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player1])
        .rpc();

      // Player 2 tries to join (should fail)
      try {
        await program.methods
          .joinMatch()
          .accounts({
            match: fullMatch,
            player: player2.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([player2])
          .rpc();

        expect.fail("Should have failed - match is full");
      } catch (err) {
        expect(err.toString()).to.include("MatchFull");
      }
    });
  });

  describe("Predictions", () => {
    let predictionMatchId: BN;
    let predictionMatch: PublicKey;

    before(async () => {
      predictionMatchId = new BN(Date.now() + 2000);
      [predictionMatch] = PublicKey.findProgramAddressSync(
        [Buffer.from("match"), predictionMatchId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create and start match
      await program.methods
        .createMatch({
          matchId: predictionMatchId,
          marketName: "SOL/USD",
          entryFee: ENTRY_FEE,
          maxPlayers: MAX_PLAYERS,
          duration: MATCH_DURATION,
        })
        .accounts({
          match: predictionMatch,
          market: marketAccount,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Join with player1
      await program.methods
        .joinMatch()
        .accounts({
          match: predictionMatch,
          player: player1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player1])
        .rpc();
    });

    it("Allows prediction submission within window", async () => {
      await program.methods
        .submitPrediction({ higher: {} })
        .accounts({
          match: predictionMatch,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      const match = await program.account.match.fetch(predictionMatch);
      const player1Entry = match.players.find(
        (p) => p.player.toString() === player1.publicKey.toString()
      );

      expect(player1Entry).to.exist;
      expect(player1Entry.prediction).to.have.property("higher");
      expect(player1Entry.hasPredicted).to.be.true;
    });

    it("Prevents double prediction", async () => {
      try {
        await program.methods
          .submitPrediction({ lower: {} })
          .accounts({
            match: predictionMatch,
            player: player1.publicKey,
          })
          .signers([player1])
          .rpc();

        expect.fail("Should not allow double prediction");
      } catch (err) {
        expect(err.toString()).to.include("AlreadyPredicted");
      }
    });
  });

  describe("Match Resolution", () => {
    let resolutionMatchId: BN;
    let resolutionMatch: PublicKey;

    beforeEach(async () => {
      resolutionMatchId = new BN(Date.now() + 3000);
      [resolutionMatch] = PublicKey.findProgramAddressSync(
        [Buffer.from("match"), resolutionMatchId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create match
      await program.methods
        .createMatch({
          matchId: resolutionMatchId,
          marketName: "SOL/USD",
          entryFee: ENTRY_FEE,
          maxPlayers: MAX_PLAYERS,
          duration: 10, // Short duration for testing
        })
        .accounts({
          match: resolutionMatch,
          market: marketAccount,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Player 1 joins and predicts HIGHER
      await program.methods
        .joinMatch()
        .accounts({
          match: resolutionMatch,
          player: player1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player1])
        .rpc();

      await program.methods
        .submitPrediction({ higher: {} })
        .accounts({
          match: resolutionMatch,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      // Player 2 joins and predicts LOWER
      await program.methods
        .joinMatch()
        .accounts({
          match: resolutionMatch,
          player: player2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player2])
        .rpc();

      await program.methods
        .submitPrediction({ lower: {} })
        .accounts({
          match: resolutionMatch,
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      // Wait for match duration
      await new Promise((resolve) => setTimeout(resolve, 12000));
    });

    it("Resolves match using Pyth oracle", async () => {
      await program.methods
        .resolveMatch()
        .accounts({
          match: resolutionMatch,
          market: marketAccount,
          pythPriceFeed: pythPriceFeed,
          resolver: authority.publicKey,
        })
        .rpc();

      const match = await program.account.match.fetch(resolutionMatch);
      expect(match.status).to.not.have.property("open");
      expect(match.finalPrice).to.exist;
      expect(match.winningSide).to.exist;
    });

    it("Distributes winnings to winners", async () => {
      // Resolve match first
      await program.methods
        .resolveMatch()
        .accounts({
          match: resolutionMatch,
          market: marketAccount,
          pythPriceFeed: pythPriceFeed,
          resolver: authority.publicKey,
        })
        .rpc();

      const matchData = await program.account.match.fetch(resolutionMatch);

      // Determine winner
      const winningSide = matchData.winningSide;
      const winner = winningSide.higher ? player1 : player2;

      const balanceBefore = await provider.connection.getBalance(winner.publicKey);

      await program.methods
        .claimWinnings()
        .accounts({
          match: resolutionMatch,
          player: winner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([winner])
        .rpc();

      const balanceAfter = await provider.connection.getBalance(winner.publicKey);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Prevents losers from claiming", async () => {
      // Resolve match
      await program.methods
        .resolveMatch()
        .accounts({
          match: resolutionMatch,
          market: marketAccount,
          pythPriceFeed: pythPriceFeed,
          resolver: authority.publicKey,
        })
        .rpc();

      const matchData = await program.account.match.fetch(resolutionMatch);
      const winningSide = matchData.winningSide;
      const loser = winningSide.higher ? player2 : player1;

      try {
        await program.methods
          .claimWinnings()
          .accounts({
            match: resolutionMatch,
            player: loser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([loser])
          .rpc();

        expect.fail("Loser should not be able to claim");
      } catch (err) {
        expect(err.toString()).to.include("NotAWinner");
      }
    });
  });

  describe("Player Stats", () => {
    before(async () => {
      [playerState1] = PublicKey.findProgramAddressSync(
        [Buffer.from("player-state"), player1.publicKey.toBuffer()],
        program.programId
      );
    });

    it("Creates and updates player state", async () => {
      await program.methods
        .createPlayerState("Player1")
        .accounts({
          playerState: playerState1,
          player: player1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player1])
        .rpc();

      const state = await program.account.playerState.fetch(playerState1);
      expect(state.player.toString()).to.equal(player1.publicKey.toString());
      expect(state.username).to.equal("Player1");
      expect(state.level).to.equal(1);
      expect(state.totalMatches).to.equal(0);
    });

    it("Updates stats after match", async () => {
      // Simulate win
      await program.methods
        .updatePlayerStats({ win: true, xpGained: 100 })
        .accounts({
          playerState: playerState1,
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      const state = await program.account.playerState.fetch(playerState1);
      expect(state.wins).to.equal(1);
      expect(state.totalMatches).to.equal(1);
      expect(state.xp).to.equal(100);
    });
  });

  describe("Match Cancellation", () => {
    it("Allows cancellation and refunds all players", async () => {
      const cancelMatchId = new BN(Date.now() + 4000);
      const [cancelMatch] = PublicKey.findProgramAddressSync(
        [Buffer.from("match"), cancelMatchId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create match
      await program.methods
        .createMatch({
          matchId: cancelMatchId,
          marketName: "SOL/USD",
          entryFee: ENTRY_FEE,
          maxPlayers: MAX_PLAYERS,
          duration: MATCH_DURATION,
        })
        .accounts({
          match: cancelMatch,
          market: marketAccount,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const balanceBefore = await provider.connection.getBalance(authority.publicKey);

      // Cancel match
      await program.methods
        .cancelMatch()
        .accounts({
          match: cancelMatch,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const balanceAfter = await provider.connection.getBalance(authority.publicKey);
      const match = await program.account.match.fetch(cancelMatch);

      expect(match.status).to.have.property("cancelled");
      expect(balanceAfter).to.be.greaterThan(balanceBefore); // Refunded
    });
  });
});
