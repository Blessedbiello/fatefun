/**
 * Solana Sync Layer
 * Bridges Moddio game state with Solana blockchain
 */

class SolanaSync {
  constructor(game, config) {
    this.game = game
    this.config = config

    // Solana connection
    this.connection = null
    this.program = null
    this.wallet = null

    // Sync state
    this.syncInterval = config.solana?.syncInterval || 2000
    this.syncTimer = null
    this.lastSync = 0

    // Subscriptions
    this.matchSubscription = null
    this.priceSubscription = null

    // Cache
    this.matchCache = new Map()
    this.priceCache = new Map()
  }

  async initialize(wallet, connection, program) {
    this.wallet = wallet
    this.connection = connection
    this.program = program

    console.log('✅ Solana sync initialized')
  }

  // Subscribe to match account updates
  async subscribeToMatch(matchPubkey) {
    if (this.matchSubscription) {
      this.connection.removeAccountChangeListener(this.matchSubscription)
    }

    try {
      this.matchSubscription = this.connection.onAccountChange(
        matchPubkey,
        (accountInfo) => {
          this.onMatchUpdate(accountInfo)
        },
        'confirmed'
      )

      console.log('📡 Subscribed to match:', matchPubkey.toString())
    } catch (error) {
      console.error('Failed to subscribe to match:', error)
      // Fallback to polling
      this.startMatchPolling(matchPubkey)
    }
  }

  // Subscribe to Pyth price feed
  async subscribeToPriceFeed(pythPriceFeed) {
    if (this.priceSubscription) {
      this.connection.removeAccountChangeListener(this.priceSubscription)
    }

    try {
      this.priceSubscription = this.connection.onAccountChange(
        pythPriceFeed,
        (accountInfo) => {
          this.onPriceUpdate(accountInfo)
        },
        'confirmed'
      )

      console.log('📊 Subscribed to price feed:', pythPriceFeed.toString())
    } catch (error) {
      console.error('Failed to subscribe to price feed:', error)
      // Fallback to polling
      this.startPricePolling(pythPriceFeed)
    }
  }

  // Handle match account update
  onMatchUpdate(accountInfo) {
    try {
      const match = this.program.account.match.coder.accounts.decode('Match', accountInfo.data)

      // Emit to game
      this.game.emit('blockchain-match-update', match)

      // Update cache
      this.matchCache.set(match.matchId.toString(), match)

      // Sync specific fields to game state
      this.syncMatchState(match)
    } catch (error) {
      console.error('Error parsing match update:', error)
    }
  }

  // Handle price feed update
  onPriceUpdate(accountInfo) {
    try {
      // Parse Pyth price data
      const price = this.parsePythPrice(accountInfo.data)

      // Emit to game
      this.game.emit('price-update', {
        price: price,
        timestamp: Date.now(),
      })

      // Update cache
      this.priceCache.set('current', price)
    } catch (error) {
      console.error('Error parsing price update:', error)
    }
  }

  // Parse Pyth price data
  parsePythPrice(data) {
    // Simplified - actual Pyth parsing is more complex
    // In production, use @pythnetwork/client
    const view = new DataView(data.buffer)
    const price = view.getBigInt64(0, true)
    const expo = view.getInt32(8, true)

    return Number(price) * Math.pow(10, expo)
  }

  // Sync blockchain match state to game
  syncMatchState(match) {
    // Update game state based on blockchain
    const gameState = {
      matchId: match.matchId.toString(),
      status: this.convertMatchStatus(match.status),
      currentPlayers: match.currentPlayers,
      startingPrice: Number(match.startingPrice) / 1e8,
      predictionDeadline: Number(match.predictionDeadline),
      resolutionTime: Number(match.resolutionTime),
      higherPool: Number(match.higherPool),
      lowerPool: Number(match.lowerPool),
    }

    this.game.emit('match-state-sync', gameState)
  }

  convertMatchStatus(status) {
    // Convert blockchain status to game status
    if (status.open) return 'prediction'
    if (status.inProgress) return 'resolution'
    if (status.completed) return 'ended'
    return 'unknown'
  }

  // Polling fallback for match updates
  startMatchPolling(matchPubkey) {
    if (this.syncTimer) clearInterval(this.syncTimer)

    this.syncTimer = setInterval(async () => {
      try {
        const accountInfo = await this.connection.getAccountInfo(matchPubkey)
        if (accountInfo) {
          this.onMatchUpdate(accountInfo)
        }
      } catch (error) {
        console.error('Match polling error:', error)
      }
    }, this.syncInterval)

    console.log('🔄 Match polling started')
  }

  // Polling fallback for price updates
  startPricePolling(pythPriceFeed) {
    setInterval(async () => {
      try {
        const accountInfo = await this.connection.getAccountInfo(pythPriceFeed)
        if (accountInfo) {
          this.onPriceUpdate(accountInfo)
        }
      } catch (error) {
        console.error('Price polling error:', error)
      }
    }, 1000) // Poll prices every second

    console.log('📊 Price polling started')
  }

  // Submit prediction to blockchain
  async submitPrediction(matchId, prediction) {
    try {
      const tx = await this.program.methods
        .submitPrediction({
          prediction: prediction === 'higher' ? { higher: {} } : { lower: {} }
        })
        .accounts({
          match: new PublicKey(matchId),
          player: this.wallet.publicKey,
          // ... other accounts
        })
        .rpc()

      console.log('✅ Prediction submitted:', tx)
      return tx
    } catch (error) {
      console.error('Failed to submit prediction:', error)
      throw error
    }
  }

  // Cleanup
  destroy() {
    if (this.matchSubscription) {
      this.connection.removeAccountChangeListener(this.matchSubscription)
    }

    if (this.priceSubscription) {
      this.connection.removeAccountChangeListener(this.priceSubscription)
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    console.log('🔌 Solana sync destroyed')
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SolanaSync
}
