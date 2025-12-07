/**
 * FATE Protocol - Match Controller
 * Handles game state synchronization with Solana blockchain
 */

export interface MatchState {
  matchId: number
  players: Player[]
  currentPrice: number
  startPrice: number
  targetPrice?: number
  timeRemaining: number
  state: 'waiting' | 'active' | 'ended'
}

export interface Player {
  wallet: string
  prediction: 'up' | 'down'
  position: { x: number; y: number }
  avatar: string
  wager: number
}

export class MatchController {
  private matchState: MatchState
  private updateInterval: NodeJS.Timeout | null = null

  constructor(matchId: number) {
    this.matchState = {
      matchId,
      players: [],
      currentPrice: 0,
      startPrice: 0,
      timeRemaining: 300,
      state: 'waiting',
    }
  }

  async initialize() {
    // Fetch match state from blockchain
    // This would use the Anchor program via WebSocket
    console.log(`Initializing match ${this.matchState.matchId}`)
  }

  addPlayer(player: Player) {
    this.matchState.players.push(player)
    this.broadcastState()
  }

  removePlayer(wallet: string) {
    this.matchState.players = this.matchState.players.filter(
      (p) => p.wallet !== wallet
    )
    this.broadcastState()
  }

  startMatch() {
    this.matchState.state = 'active'
    this.matchState.startPrice = this.matchState.currentPrice

    // Start countdown timer
    this.updateInterval = setInterval(() => {
      this.matchState.timeRemaining -= 1

      if (this.matchState.timeRemaining <= 0) {
        this.endMatch()
      }

      this.broadcastState()
    }, 1000)
  }

  updatePrice(price: number) {
    this.matchState.currentPrice = price
    this.broadcastState()
  }

  endMatch() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    this.matchState.state = 'ended'
    this.broadcastState()

    // Trigger blockchain resolution
    this.resolveOnChain()
  }

  private async resolveOnChain() {
    // Call Solana program to resolve match
    console.log('Resolving match on-chain...')
  }

  private broadcastState() {
    // Broadcast state to all connected clients via Moddio
    console.log('Broadcasting match state:', this.matchState)
  }

  getState(): MatchState {
    return this.matchState
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
  }
}
