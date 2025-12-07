/**
 * Moddio Configuration for FATE Protocol
 * Real-time multiplayer prediction arena
 */

module.exports = {
  // Game metadata
  name: 'FATE Protocol Arena',
  description: 'Real-time PvP prediction battles on Solana',
  version: '1.0.0',

  // Server settings
  server: {
    port: process.env.MODDIO_PORT || 2001,
    maxPlayers: 10,
    tickRate: 60, // 60 FPS
    matchDuration: 300, // 5 minutes default
  },

  // Room settings
  room: {
    matchmaking: {
      enabled: true,
      minPlayers: 2,
      maxPlayers: 10,
      waitTime: 30, // seconds before force start
    },
    spectators: {
      enabled: true,
      maxSpectators: 50,
    },
  },

  // World settings
  world: {
    width: 1920,
    height: 1080,
    gravity: 0, // Top-down view
    background: '#0a0a0a',
  },

  // Physics
  physics: {
    enabled: true,
    engine: 'matter', // Matter.js for collisions
    bounds: {
      left: 0,
      top: 0,
      right: 1920,
      bottom: 1080,
    },
  },

  // Network
  network: {
    interpolation: true,
    compression: true,
    updateRate: 20, // Send updates 20 times per second
    syncInterval: 100, // Full sync every 100ms
  },

  // Solana integration
  solana: {
    network: process.env.SOLANA_NETWORK || 'devnet',
    programId: process.env.FATE_ARENA_PROGRAM_ID,
    // Sync blockchain state every 2 seconds
    syncInterval: 2000,
  },

  // Asset paths
  assets: {
    sprites: './assets/sprites',
    sounds: './assets/sounds',
    fonts: './assets/fonts',
  },

  // UI theme (match FATE Protocol)
  theme: {
    colors: {
      primary: '#a855f7', // Purple
      secondary: '#ec4899', // Pink
      success: '#10b981', // Green
      danger: '#ef4444', // Red
      warning: '#f59e0b', // Yellow
      dark: '#0a0a0a',
      light: '#f9fafb',
    },
    fonts: {
      primary: 'Inter, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
  },

  // Chat settings
  chat: {
    enabled: true,
    maxLength: 200,
    rateLimitMs: 1000, // 1 message per second
    profanityFilter: true,
  },

  // Emotes
  emotes: {
    enabled: true,
    cooldownMs: 3000, // 3 seconds between emotes
    available: [
      { id: 'bullish', icon: '🚀', label: 'Bullish!' },
      { id: 'bearish', icon: '🐻', label: 'Bearish!' },
      { id: 'fire', icon: '🔥', label: 'Fire!' },
      { id: 'gg', icon: '🎮', label: 'GG!' },
      { id: 'laugh', icon: '😂', label: 'LOL' },
      { id: 'sad', icon: '😢', label: 'RIP' },
      { id: 'thinking', icon: '🤔', label: 'Hmm...' },
      { id: 'celebrate', icon: '🎉', label: 'Let\'s go!' },
    ],
  },

  // Debug
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    showFPS: true,
    showCollisions: false,
    logNetwork: false,
  },
}
