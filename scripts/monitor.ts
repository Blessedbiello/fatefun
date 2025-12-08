/**
 * Monitoring Script
 * Listens for on-chain events and sends notifications
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";

interface MatchEvent {
  type: "created" | "started" | "resolved";
  matchId: string;
  market: string;
  players: number;
  entryFee: number;
  totalPool?: number;
  winner?: string;
}

async function sendDiscordNotification(message: string, embed?: any) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log("📢 Notification:", message);
    return;
  }

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      content: message,
      embeds: embed ? [embed] : undefined,
    });
  } catch (err) {
    console.error("Failed to send Discord notification:", err);
  }
}

async function monitorMatches(program: Program) {
  console.log("👀 Monitoring match events...\n");

  // Subscribe to match account changes
  const [arenaConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("arena-config")],
    program.programId
  );

  // Listen for new matches (simplified - would need account indexing in production)
  const matchFilter = {
    memcmp: {
      offset: 0,
      bytes: "match",
    },
  };

  let lastProcessed = Date.now();

  setInterval(async () => {
    try {
      // In production, use Helius webhooks or getProgramAccounts with filters
      const accounts = await program.account.match.all();

      for (const account of accounts) {
        const match = account.account;
        const createdAt = Number(match.createdAt) * 1000;

        // Only process recent matches (created in last check interval)
        if (createdAt < lastProcessed) continue;

        // Match created
        if (match.status.open) {
          await sendDiscordNotification(
            `🎮 **New Match Created!**`,
            {
              title: match.marketName,
              description: `A new prediction match has been created`,
              color: 0xa855f7, // Purple
              fields: [
                {
                  name: "Entry Fee",
                  value: `${(Number(match.entryFee) / 1e9).toFixed(2)} SOL`,
                  inline: true,
                },
                {
                  name: "Max Players",
                  value: match.maxPlayers.toString(),
                  inline: true,
                },
                {
                  name: "Duration",
                  value: `${match.duration}s`,
                  inline: true,
                },
                {
                  name: "Match ID",
                  value: match.matchId.toString().slice(0, 16) + "...",
                  inline: false,
                },
              ],
              timestamp: new Date().toISOString(),
              footer: {
                text: `FATE Protocol | ${NETWORK}`,
              },
            }
          );
        }

        // Match in progress
        if (match.status.inProgress) {
          await sendDiscordNotification(
            `⚔️ **Match Started!**`,
            {
              title: `${match.marketName} - ${match.players.length} Players`,
              description: `The battle has begun!`,
              color: 0xf59e0b, // Yellow
              fields: [
                {
                  name: "Total Pool",
                  value: `${(Number(match.totalPool) / 1e9).toFixed(2)} SOL`,
                  inline: true,
                },
                {
                  name: "Starting Price",
                  value: `$${match.startingPrice.toFixed(2)}`,
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
            }
          );
        }

        // Match resolved
        if (match.status.completed) {
          const priceChange = ((match.finalPrice - match.startingPrice) / match.startingPrice) * 100;
          const winningSide = match.winningSide.higher ? "HIGHER" : "LOWER";
          const winners = match.players.filter(
            (p: any) => p.prediction && Object.keys(p.prediction)[0] === winningSide.toLowerCase()
          );

          await sendDiscordNotification(
            `🏆 **Match Completed!**`,
            {
              title: `${match.marketName} - ${winningSide} Wins!`,
              description: `Price moved ${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%`,
              color: priceChange >= 0 ? 0x10b981 : 0xef4444, // Green/Red
              fields: [
                {
                  name: "Starting Price",
                  value: `$${match.startingPrice.toFixed(2)}`,
                  inline: true,
                },
                {
                  name: "Final Price",
                  value: `$${match.finalPrice.toFixed(2)}`,
                  inline: true,
                },
                {
                  name: "Winners",
                  value: `${winners.length}/${match.players.length} players`,
                  inline: true,
                },
                {
                  name: "Prize Pool",
                  value: `${(Number(match.totalPool) / 1e9).toFixed(2)} SOL`,
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
            }
          );
        }
      }

      lastProcessed = Date.now();
    } catch (err) {
      console.error("Error monitoring matches:", err);
    }
  }, 10000); // Check every 10 seconds
}

async function monitorProposals(program: Program) {
  console.log("🏛️ Monitoring governance proposals...\n");

  let lastProposalCheck = Date.now();

  setInterval(async () => {
    try {
      const proposals = await program.account.proposal.all();

      for (const proposal of proposals) {
        const prop = proposal.account;
        const createdAt = Number(prop.createdAt) * 1000;

        if (createdAt < lastProposalCheck) continue;

        // New proposal
        if (prop.status.voting) {
          await sendDiscordNotification(
            `🗳️ **New Proposal!**`,
            {
              title: prop.marketName,
              description: prop.description,
              color: 0xec4899, // Pink
              fields: [
                {
                  name: "Proposer",
                  value: prop.proposer.toString().slice(0, 8) + "...",
                  inline: true,
                },
                {
                  name: "Voting Ends",
                  value: `<t:${Number(prop.votingEnds)}:R>`,
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
            }
          );
        }

        // Proposal resolved
        if (prop.status.passed || prop.status.failed) {
          const passed = prop.status.passed;

          await sendDiscordNotification(
            `${passed ? "✅" : "❌"} **Proposal ${passed ? "Passed" : "Failed"}!**`,
            {
              title: prop.marketName,
              description: prop.description,
              color: passed ? 0x10b981 : 0xef4444,
              fields: [
                {
                  name: "Pass Pool",
                  value: `${(Number(prop.passPool) / 1e9).toFixed(2)} SOL`,
                  inline: true,
                },
                {
                  name: "Fail Pool",
                  value: `${(Number(prop.failPool) / 1e9).toFixed(2)} SOL`,
                  inline: true,
                },
                {
                  name: "Pass Price",
                  value: `${(prop.passPrice / 100).toFixed(2)}%`,
                  inline: true,
                },
                {
                  name: "Fail Price",
                  value: `${(prop.failPrice / 100).toFixed(2)}%`,
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
            }
          );
        }
      }

      lastProposalCheck = Date.now();
    } catch (err) {
      console.error("Error monitoring proposals:", err);
    }
  }, 15000); // Check every 15 seconds
}

async function trackMetrics(connection: anchor.web3.Connection) {
  console.log("📊 Tracking protocol metrics...\n");

  setInterval(async () => {
    try {
      // Get program accounts
      const arenaProgram = new PublicKey(process.env.NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID!);

      const programAccount = await connection.getAccountInfo(arenaProgram);
      if (!programAccount) return;

      // In production, query database or use indexer for metrics
      const metrics = {
        timestamp: new Date().toISOString(),
        network: NETWORK,
        // Would include: total matches, active matches, total volume, unique players, etc.
      };

      console.log("📈 Metrics:", metrics);

      // Send weekly summary to Discord
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() === 0) {
        // Sunday midnight
        await sendDiscordNotification(
          `📊 **Weekly Protocol Summary**`,
          {
            title: "FATE Protocol - Week in Review",
            description: "Summary of protocol activity this week",
            color: 0xa855f7,
            fields: [
              {
                name: "Total Matches",
                value: "Loading...",
                inline: true,
              },
              {
                name: "Total Volume",
                value: "Loading... SOL",
                inline: true,
              },
              {
                name: "Active Players",
                value: "Loading...",
                inline: true,
              },
            ],
            timestamp: now.toISOString(),
          }
        );
      }
    } catch (err) {
      console.error("Error tracking metrics:", err);
    }
  }, 60000); // Check every minute
}

async function main() {
  console.log("🎮 FATE Protocol Monitoring Service\n");
  console.log(`Network: ${NETWORK}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const arenaProgramId = new PublicKey(process.env.NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID!);
  const councilProgramId = new PublicKey(process.env.NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID!);

  const arenaIdl = await Program.fetchIdl(arenaProgramId, provider);
  const councilIdl = await Program.fetchIdl(councilProgramId, provider);

  const arenaProgram = new Program(arenaIdl!, provider);
  const councilProgram = new Program(councilIdl!, provider);

  // Start monitoring
  await Promise.all([
    monitorMatches(arenaProgram),
    monitorProposals(councilProgram),
    trackMetrics(provider.connection),
  ]);

  // Send startup notification
  await sendDiscordNotification(
    "✅ **Monitoring Service Started**",
    {
      title: "FATE Protocol Monitor",
      description: "Now tracking matches, proposals, and metrics",
      color: 0x10b981,
      fields: [
        {
          name: "Network",
          value: NETWORK,
          inline: true,
        },
        {
          name: "Status",
          value: "🟢 Online",
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    }
  );

  console.log("✅ Monitoring service running...\n");

  // Keep process alive
  process.on("SIGINT", async () => {
    await sendDiscordNotification("⚠️ **Monitoring Service Stopped**");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("❌ Monitoring service failed:", err);
  process.exit(1);
});
