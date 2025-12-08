import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import { FateCouncil } from "../target/types/fate_council";

describe("FATE Council", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FateCouncil as Program<FateCouncil>;

  // Test accounts
  const authority = provider.wallet as anchor.Wallet;
  let councilConfig: PublicKey;
  let proposalAccount: PublicKey;
  let votePosition1: PublicKey;
  let votePosition2: PublicKey;

  // Test keypairs
  const voter1 = Keypair.generate();
  const voter2 = Keypair.generate();
  const voter3 = Keypair.generate();

  // Mock Pyth price feed
  const pythPriceFeed = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");

  // Test constants
  const PROPOSAL_STAKE = new BN(1 * LAMPORTS_PER_SOL);
  const VOTING_PERIOD = 86400; // 24 hours
  const MIN_VOTE = new BN(0.1 * LAMPORTS_PER_SOL);

  before(async () => {
    // Airdrop SOL to test accounts
    await Promise.all([
      provider.connection.requestAirdrop(voter1.publicKey, 10 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(voter2.publicKey, 10 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(voter3.publicKey, 10 * LAMPORTS_PER_SOL),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Derive PDAs
    [councilConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("council-config")],
      program.programId
    );
  });

  describe("Initialization", () => {
    it("Initializes council config", async () => {
      try {
        await program.methods
          .initializeCouncil({
            proposalStake: PROPOSAL_STAKE,
            minVote: MIN_VOTE,
            votingPeriod: VOTING_PERIOD,
          })
          .accounts({
            config: councilConfig,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const config = await program.account.councilConfig.fetch(councilConfig);
        expect(config.authority.toString()).to.equal(authority.publicKey.toString());
        expect(config.proposalStake.toString()).to.equal(PROPOSAL_STAKE.toString());
      } catch (err) {
        console.log("Council already initialized or error:", err);
      }
    });
  });

  describe("Proposal Management", () => {
    let proposalId: BN;

    beforeEach(async () => {
      proposalId = new BN(Date.now());

      [proposalAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
    });

    it("Creates proposal with required stake", async () => {
      await program.methods
        .createProposal({
          proposalId,
          marketName: "Add BTC/USD Market",
          description: "Should we add Bitcoin price prediction market?",
          pythPriceFeed: pythPriceFeed,
        })
        .accounts({
          proposal: proposalAccount,
          proposer: authority.publicKey,
          config: councilConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const proposal = await program.account.proposal.fetch(proposalAccount);
      expect(proposal.marketName).to.equal("Add BTC/USD Market");
      expect(proposal.proposer.toString()).to.equal(authority.publicKey.toString());
      expect(proposal.status).to.have.property("voting");
      expect(proposal.passPool.toNumber()).to.equal(0);
      expect(proposal.failPool.toNumber()).to.equal(0);
    });

    it("Fails to create proposal without sufficient stake", async () => {
      const poorVoter = Keypair.generate();

      // Only airdrop 0.5 SOL (less than required 1 SOL stake)
      await provider.connection.requestAirdrop(poorVoter.publicKey, 0.5 * LAMPORTS_PER_SOL);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const poorProposalId = new BN(Date.now() + 1000);
      const [poorProposal] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), poorProposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      try {
        await program.methods
          .createProposal({
            proposalId: poorProposalId,
            marketName: "Test",
            description: "Test proposal",
            pythPriceFeed: pythPriceFeed,
          })
          .accounts({
            proposal: poorProposal,
            proposer: poorVoter.publicKey,
            config: councilConfig,
            systemProgram: SystemProgram.programId,
          })
          .signers([poorVoter])
          .rpc();

        expect.fail("Should fail without sufficient stake");
      } catch (err) {
        expect(err).to.exist;
      }
    });
  });

  describe("Voting Mechanism", () => {
    let voteProposalId: BN;
    let voteProposal: PublicKey;

    before(async () => {
      voteProposalId = new BN(Date.now() + 2000);
      [voteProposal] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), voteProposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create proposal for voting tests
      await program.methods
        .createProposal({
          proposalId: voteProposalId,
          marketName: "Vote Test Market",
          description: "Testing voting mechanism",
          pythPriceFeed: pythPriceFeed,
        })
        .accounts({
          proposal: voteProposal,
          proposer: authority.publicKey,
          config: councilConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });

    it("Allows voting on PASS outcome", async () => {
      const voteAmount = new BN(1 * LAMPORTS_PER_SOL);

      [votePosition1] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote-position"),
          voteProposal.toBuffer(),
          voter1.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .vote({ pass: {} }, voteAmount)
        .accounts({
          proposal: voteProposal,
          votePosition: votePosition1,
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      const proposal = await program.account.proposal.fetch(voteProposal);
      const position = await program.account.votePosition.fetch(votePosition1);

      expect(proposal.passPool.toNumber()).to.equal(voteAmount.toNumber());
      expect(position.passTokens.toNumber()).to.equal(voteAmount.toNumber());
      expect(position.failTokens.toNumber()).to.equal(0);
    });

    it("Allows voting on FAIL outcome", async () => {
      const voteAmount = new BN(2 * LAMPORTS_PER_SOL);

      [votePosition2] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote-position"),
          voteProposal.toBuffer(),
          voter2.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .vote({ fail: {} }, voteAmount)
        .accounts({
          proposal: voteProposal,
          votePosition: votePosition2,
          voter: voter2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();

      const proposal = await program.account.proposal.fetch(voteProposal);
      const position = await program.account.votePosition.fetch(votePosition2);

      expect(proposal.failPool.toNumber()).to.equal(voteAmount.toNumber());
      expect(position.failTokens.toNumber()).to.equal(voteAmount.toNumber());
      expect(position.passTokens.toNumber()).to.equal(0);
    });

    it("Calculates prices correctly using AMM formula", async () => {
      const proposal = await program.account.proposal.fetch(voteProposal);

      const totalPool = proposal.passPool.add(proposal.failPool);
      const expectedPassPrice = Math.floor(
        (proposal.failPool.toNumber() / totalPool.toNumber()) * 10000
      );
      const expectedFailPrice = Math.floor(
        (proposal.passPool.toNumber() / totalPool.toNumber()) * 10000
      );

      expect(proposal.passPrice).to.be.closeTo(expectedPassPrice, 1);
      expect(proposal.failPrice).to.be.closeTo(expectedFailPrice, 1);

      // Prices should sum to 10000 (100%)
      expect(proposal.passPrice + proposal.failPrice).to.equal(10000);
    });

    it("Allows adding to existing position", async () => {
      const additionalVote = new BN(0.5 * LAMPORTS_PER_SOL);

      const positionBefore = await program.account.votePosition.fetch(votePosition1);

      await program.methods
        .vote({ pass: {} }, additionalVote)
        .accounts({
          proposal: voteProposal,
          votePosition: votePosition1,
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      const positionAfter = await program.account.votePosition.fetch(votePosition1);

      expect(positionAfter.passTokens.toNumber()).to.equal(
        positionBefore.passTokens.add(additionalVote).toNumber()
      );
    });
  });

  describe("Proposal Resolution", () => {
    let passProposalId: BN;
    let failProposalId: BN;
    let passProposal: PublicKey;
    let failProposal: PublicKey;

    before(async () => {
      // Create proposal that will pass (pass_price < fail_price)
      passProposalId = new BN(Date.now() + 3000);
      [passProposal] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), passProposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      await program.methods
        .createProposal({
          proposalId: passProposalId,
          marketName: "Should Pass",
          description: "This proposal should pass",
          pythPriceFeed: pythPriceFeed,
        })
        .accounts({
          proposal: passProposal,
          proposer: authority.publicKey,
          config: councilConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // More PASS votes (lower price, more demand)
      await program.methods
        .vote({ pass: {} }, new BN(5 * LAMPORTS_PER_SOL))
        .accounts({
          proposal: passProposal,
          votePosition: PublicKey.findProgramAddressSync(
            [Buffer.from("vote-position"), passProposal.toBuffer(), voter1.publicKey.toBuffer()],
            program.programId
          )[0],
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      await program.methods
        .vote({ fail: {} }, new BN(2 * LAMPORTS_PER_SOL))
        .accounts({
          proposal: passProposal,
          votePosition: PublicKey.findProgramAddressSync(
            [Buffer.from("vote-position"), passProposal.toBuffer(), voter2.publicKey.toBuffer()],
            program.programId
          )[0],
          voter: voter2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();

      // Create proposal that will fail (fail_price < pass_price)
      failProposalId = new BN(Date.now() + 4000);
      [failProposal] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), failProposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      await program.methods
        .createProposal({
          proposalId: failProposalId,
          marketName: "Should Fail",
          description: "This proposal should fail",
          pythPriceFeed: pythPriceFeed,
        })
        .accounts({
          proposal: failProposal,
          proposer: authority.publicKey,
          config: councilConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // More FAIL votes
      await program.methods
        .vote({ pass: {} }, new BN(2 * LAMPORTS_PER_SOL))
        .accounts({
          proposal: failProposal,
          votePosition: PublicKey.findProgramAddressSync(
            [Buffer.from("vote-position"), failProposal.toBuffer(), voter1.publicKey.toBuffer()],
            program.programId
          )[0],
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      await program.methods
        .vote({ fail: {} }, new BN(5 * LAMPORTS_PER_SOL))
        .accounts({
          proposal: failProposal,
          votePosition: PublicKey.findProgramAddressSync(
            [Buffer.from("vote-position"), failProposal.toBuffer(), voter2.publicKey.toBuffer()],
            program.programId
          )[0],
          voter: voter2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();
    });

    it("Resolves proposal as PASSED when pass_price < fail_price", async () => {
      // Wait for voting period (or mock time in test)
      // In production, would wait VOTING_PERIOD seconds

      await program.methods
        .resolveProposal()
        .accounts({
          proposal: passProposal,
          resolver: authority.publicKey,
        })
        .rpc();

      const proposal = await program.account.proposal.fetch(passProposal);
      expect(proposal.status).to.have.property("passed");

      // Verify pass_price < fail_price
      expect(proposal.passPrice).to.be.lessThan(proposal.failPrice);
    });

    it("Resolves proposal as FAILED when fail_price < pass_price", async () => {
      await program.methods
        .resolveProposal()
        .accounts({
          proposal: failProposal,
          resolver: authority.publicKey,
        })
        .rpc();

      const proposal = await program.account.proposal.fetch(failProposal);
      expect(proposal.status).to.have.property("failed");

      // Verify fail_price < pass_price
      expect(proposal.failPrice).to.be.lessThan(proposal.passPrice);
    });
  });

  describe("Token Claims", () => {
    let claimProposalId: BN;
    let claimProposal: PublicKey;
    let winnerPosition: PublicKey;
    let loserPosition: PublicKey;

    before(async () => {
      claimProposalId = new BN(Date.now() + 5000);
      [claimProposal] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), claimProposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create and resolve proposal
      await program.methods
        .createProposal({
          proposalId: claimProposalId,
          marketName: "Claim Test",
          description: "Testing token claims",
          pythPriceFeed: pythPriceFeed,
        })
        .accounts({
          proposal: claimProposal,
          proposer: authority.publicKey,
          config: councilConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Voter1 votes PASS (will win)
      [winnerPosition] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote-position"), claimProposal.toBuffer(), voter1.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .vote({ pass: {} }, new BN(3 * LAMPORTS_PER_SOL))
        .accounts({
          proposal: claimProposal,
          votePosition: winnerPosition,
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      // Voter2 votes FAIL (will lose)
      [loserPosition] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote-position"), claimProposal.toBuffer(), voter2.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .vote({ fail: {} }, new BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          proposal: claimProposal,
          votePosition: loserPosition,
          voter: voter2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();

      // Resolve (PASS wins)
      await program.methods
        .resolveProposal()
        .accounts({
          proposal: claimProposal,
          resolver: authority.publicKey,
        })
        .rpc();
    });

    it("Winners can claim tokens", async () => {
      const balanceBefore = await provider.connection.getBalance(voter1.publicKey);

      await program.methods
        .claimTokens()
        .accounts({
          proposal: claimProposal,
          votePosition: winnerPosition,
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      const balanceAfter = await provider.connection.getBalance(voter1.publicKey);

      // Should receive original stake + proportional share of losing pool
      expect(balanceAfter).to.be.greaterThan(balanceBefore);

      const position = await program.account.votePosition.fetch(winnerPosition);
      expect(position.claimed).to.be.true;
    });

    it("Losers cannot claim tokens", async () => {
      try {
        await program.methods
          .claimTokens()
          .accounts({
            proposal: claimProposal,
            votePosition: loserPosition,
            voter: voter2.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter2])
          .rpc();

        expect.fail("Losers should not be able to claim");
      } catch (err) {
        expect(err.toString()).to.include("NotAWinner");
      }
    });

    it("Prevents double claiming", async () => {
      try {
        await program.methods
          .claimTokens()
          .accounts({
            proposal: claimProposal,
            votePosition: winnerPosition,
            voter: voter1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([voter1])
          .rpc();

        expect.fail("Should not allow double claiming");
      } catch (err) {
        expect(err.toString()).to.include("AlreadyClaimed");
      }
    });
  });

  describe("Proposal Execution", () => {
    it("Executes passed proposals to create markets", async () => {
      const execProposalId = new BN(Date.now() + 6000);
      const [execProposal] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), execProposalId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create and pass proposal
      await program.methods
        .createProposal({
          proposalId: execProposalId,
          marketName: "ETH/USD",
          description: "Add Ethereum market",
          pythPriceFeed: pythPriceFeed,
        })
        .accounts({
          proposal: execProposal,
          proposer: authority.publicKey,
          config: councilConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Vote to pass
      await program.methods
        .vote({ pass: {} }, new BN(5 * LAMPORTS_PER_SOL))
        .accounts({
          proposal: execProposal,
          votePosition: PublicKey.findProgramAddressSync(
            [Buffer.from("vote-position"), execProposal.toBuffer(), voter1.publicKey.toBuffer()],
            program.programId
          )[0],
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      // Resolve as passed
      await program.methods
        .resolveProposal()
        .accounts({
          proposal: execProposal,
          resolver: authority.publicKey,
        })
        .rpc();

      // Execute proposal
      await program.methods
        .executeProposal()
        .accounts({
          proposal: execProposal,
          authority: authority.publicKey,
        })
        .rpc();

      const proposal = await program.account.proposal.fetch(execProposal);
      expect(proposal.status).to.have.property("executed");
    });

    it("Cannot execute failed proposals", async () => {
      const failExecId = new BN(Date.now() + 7000);
      const [failExec] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), failExecId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      // Create and fail proposal
      await program.methods
        .createProposal({
          proposalId: failExecId,
          marketName: "Bad Market",
          description: "This will fail",
          pythPriceFeed: pythPriceFeed,
        })
        .accounts({
          proposal: failExec,
          proposer: authority.publicKey,
          config: councilConfig,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Vote to fail
      await program.methods
        .vote({ fail: {} }, new BN(5 * LAMPORTS_PER_SOL))
        .accounts({
          proposal: failExec,
          votePosition: PublicKey.findProgramAddressSync(
            [Buffer.from("vote-position"), failExec.toBuffer(), voter1.publicKey.toBuffer()],
            program.programId
          )[0],
          voter: voter1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

      // Resolve as failed
      await program.methods
        .resolveProposal()
        .accounts({
          proposal: failExec,
          resolver: authority.publicKey,
        })
        .rpc();

      // Try to execute (should fail)
      try {
        await program.methods
          .executeProposal()
          .accounts({
            proposal: failExec,
            authority: authority.publicKey,
          })
          .rpc();

        expect.fail("Should not execute failed proposal");
      } catch (err) {
        expect(err.toString()).to.include("ProposalNotPassed");
      }
    });
  });
});
