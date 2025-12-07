# FATE Protocol - Game Engine

This directory contains the Moddio game engine integration for FATE Protocol's real-time battle arena.

## Structure

```
game/
├── assets/          # Game assets (sprites, sounds, music)
│   ├── sprites/     # Character and UI sprites
│   ├── sounds/      # Sound effects
│   └── music/       # Background music
├── scenes/          # Game scenes
│   ├── lobby.json   # Pre-match lobby
│   ├── arena.json   # Battle arena
│   └── results.json # Post-match results
├── scripts/         # Game logic
│   ├── matchController.ts  # Match state management
│   └── priceOracle.ts      # Price feed integration
└── game.config.json # Game configuration
```

## Integration with Solana

The game engine integrates with the Solana blockchain in the following ways:

1. **Match Initialization**: When a match is created on-chain, the game engine initializes a new match instance
2. **Player Joining**: Player predictions are submitted to the blockchain and reflected in the game
3. **Real-time Updates**: Price data from Pyth Network is displayed in real-time in the arena
4. **Match Resolution**: When the match ends, the game triggers the on-chain resolution via the smart contract

## Moddio Setup

To use this with Moddio:

1. Create a new game on the Moddio platform
2. Upload the game assets and scenes
3. Configure the game settings in the Moddio dashboard
4. Set the environment variables in your `.env` file:
   - `NEXT_PUBLIC_MODDIO_GAME_ID`
   - `NEXT_PUBLIC_MODDIO_API_KEY`
   - `NEXT_PUBLIC_MODDIO_SERVER_URL`

## Development

The game scripts are written in TypeScript and can be tested independently or integrated with the Next.js frontend.

For local development:
```bash
# Install dependencies
npm install

# Run game in development mode
npm run game:dev
```
