/**
 * Arena Scene
 * Main gameplay scene where predictions happen
 */

const Player = require('../entities/Player')
const PredictionOrb = require('../entities/PredictionOrb')
const PriceChart = require('../entities/PriceChart')

class Arena {
  constructor(game) {
    this.game = game
    this.name = 'Arena'

    // Game state
    this.matchState = 'prediction' // 'prediction', 'resolution', 'ended'
    this.predictionDeadline = null
    this.resolutionTime = null

    // Entities
    this.players = new Map()
    this.predictionOrbs = new Map()
    this.priceChart = null

    // Match data
    this.matchId = null
    this.startingPrice = 0
    this.currentPrice = 0
    this.marketName = 'SOL/USD'

    // Local player
    this.localPlayer = null
    this.hasPredicted = false

    // Camera
    this.cameraTarget = { x: 960, y: 540 }
  }

  init(data) {
    this.matchId = data.matchId
    this.marketName = data.marketName
    this.startingPrice = data.startingPrice
    this.currentPrice = data.startingPrice
    this.predictionDeadline = data.predictionDeadline
    this.resolutionTime = data.resolutionTime

    // Create price chart
    this.priceChart = new PriceChart({
      x: 960,
      y: 100,
      marketSymbol: this.marketName,
      startingPrice: this.startingPrice,
    })

    // Setup UI
    this.setupUI()

    // Setup event listeners
    this.setupEventListeners()

    // Start price updates
    this.startPriceUpdates()
  }

  setupUI() {
    // Timer display
    this.game.ui.add({
      id: 'timer',
      type: 'text',
      x: 960,
      y: 450,
      align: 'center',
      style: {
        fontSize: '48px',
        fontWeight: 'bold',
        color: '#ffffff',
      },
    })

    // Prediction buttons
    this.game.ui.add({
      id: 'prediction-buttons',
      type: 'group',
      x: 660,
      y: 700,
      children: [
        {
          id: 'higher-button',
          type: 'button',
          x: 0,
          y: 0,
          width: 250,
          height: 100,
          label: '📈 HIGHER',
          style: 'success',
          onClick: () => this.predict('higher'),
        },
        {
          id: 'lower-button',
          type: 'button',
          x: 280,
          y: 0,
          width: 250,
          height: 100,
          label: '📉 LOWER',
          style: 'danger',
          onClick: () => this.predict('lower'),
        },
      ],
    })

    // Match info
    this.game.ui.add({
      id: 'match-info',
      type: 'panel',
      x: 20,
      y: 20,
      width: 300,
      height: 120,
      content: this.getMatchInfoHTML(),
    })

    // Scoreboard
    this.game.ui.add({
      id: 'scoreboard',
      type: 'panel',
      x: 1600,
      y: 20,
      width: 300,
      height: 400,
      content: '<div id="scoreboard-content"></div>',
    })
  }

  setupEventListeners() {
    // Player events
    this.game.on('player-joined', (player) => this.addPlayer(player))
    this.game.on('player-left', (playerId) => this.removePlayer(playerId))
    this.game.on('player-moved', (data) => this.updatePlayerPosition(data))
    this.game.on('player-predicted', (data) => this.onPlayerPredicted(data))

    // Price updates
    this.game.on('price-update', (data) => {
      this.currentPrice = data.price
      this.priceChart.addPricePoint(data.price, data.timestamp)
    })

    // Match state changes
    this.game.on('match-state-change', (state) => {
      this.matchState = state
      this.onStateChange(state)
    })

    // Keyboard controls
    this.game.input.on('keydown', (key) => this.handleInput(key))
  }

  startPriceUpdates() {
    // Subscribe to Solana price feed via network layer
    this.game.network.send('subscribe-price', {
      matchId: this.matchId,
    })
  }

  addPlayer(playerData) {
    const player = new Player(playerData)
    this.players.set(player.id, player)

    if (player.id === this.game.localPlayerId) {
      this.localPlayer = player
    }

    this.updateScoreboard()
  }

  removePlayer(playerId) {
    this.players.delete(playerId)
    this.predictionOrbs.delete(playerId)
    this.updateScoreboard()
  }

  updatePlayerPosition(data) {
    const player = this.players.get(data.playerId)
    if (player) {
      player.x = data.x
      player.y = data.y
      player.rotation = data.rotation
    }
  }

  predict(side) {
    if (this.hasPredicted || this.matchState !== 'prediction') return

    // Send to server
    this.game.network.send('make-prediction', {
      matchId: this.matchId,
      prediction: side,
    })

    // Optimistic update
    this.hasPredicted = true
    this.localPlayer?.predict(side)

    // Create prediction orb
    const orb = new PredictionOrb({
      id: `orb-${this.localPlayer.id}`,
      playerId: this.localPlayer.id,
      prediction: side,
      x: this.localPlayer.x,
      y: this.localPlayer.y,
    })
    this.predictionOrbs.set(this.localPlayer.id, orb)

    // Disable buttons
    this.game.ui.disable('higher-button')
    this.game.ui.disable('lower-button')

    // Show confirmation
    this.game.ui.showNotification({
      type: 'success',
      message: `Predicted ${side.toUpperCase()}!`,
      duration: 3000,
    })
  }

  onPlayerPredicted(data) {
    const player = this.players.get(data.playerId)
    if (player && player.id !== this.localPlayer?.id) {
      player.predict(data.prediction)

      // Create orb for other players
      const orb = new PredictionOrb({
        id: `orb-${player.id}`,
        playerId: player.id,
        prediction: data.prediction,
        x: player.x,
        y: player.y,
      })
      this.predictionOrbs.set(player.id, orb)
    }

    this.updateScoreboard()
  }

  onStateChange(state) {
    if (state === 'resolution') {
      this.game.ui.update('timer', {
        text: 'Resolution Phase...',
        color: '#f59e0b',
      })

      // Hide prediction buttons
      this.game.ui.hide('prediction-buttons')
    } else if (state === 'ended') {
      // Transition to results
      setTimeout(() => {
        this.game.changeScene('results', {
          matchId: this.matchId,
        })
      }, 3000)
    }
  }

  handleInput(key) {
    if (!this.localPlayer) return

    const speed = 200
    let vx = 0
    let vy = 0

    if (key === 'w' || key === 'ArrowUp') vy = -1
    if (key === 's' || key === 'ArrowDown') vy = 1
    if (key === 'a' || key === 'ArrowLeft') vx = -1
    if (key === 'd' || key === 'ArrowRight') vx = 1

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707
      vy *= 0.707
    }

    this.localPlayer.setVelocity(vx, vy)

    // Send movement to server
    if (vx !== 0 || vy !== 0) {
      this.game.network.send('player-move', {
        vx, vy
      })
    }
  }

  getMatchInfoHTML() {
    return `
      <div style="padding: 12px; color: white;">
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
          ${this.marketName}
        </div>
        <div style="font-size: 14px; color: #9ca3af;">
          Start: $${this.startingPrice.toFixed(2)}
        </div>
        <div style="font-size: 14px; color: #9ca3af;">
          Current: <span style="color: ${this.currentPrice >= this.startingPrice ? '#10b981' : '#ef4444'};">
            $${this.currentPrice.toFixed(2)}
          </span>
        </div>
      </div>
    `
  }

  updateScoreboard() {
    const higherCount = Array.from(this.players.values())
      .filter(p => p.prediction === 'higher').length
    const lowerCount = Array.from(this.players.values())
      .filter(p => p.prediction === 'lower').length

    const content = `
      <div style="padding: 12px;">
        <div style="font-size: 16px; font-weight: bold; color: white; margin-bottom: 12px;">
          Predictions
        </div>
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; color: #10b981; margin-bottom: 4px;">
            <span>📈 HIGHER</span>
            <span>${higherCount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #ef4444;">
            <span>📉 LOWER</span>
            <span>${lowerCount}</span>
          </div>
        </div>
        <div style="border-top: 1px solid #374151; padding-top: 12px;">
          ${Array.from(this.players.values()).map(p => `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="width: 24px; height: 24px; background: ${p.color}; border-radius: 50%; margin-right: 8px;"></div>
              <span style="color: white; font-size: 12px;">${p.username}</span>
              ${p.hasPredicted ? `<span style="margin-left: auto; font-size: 16px;">${p.prediction === 'higher' ? '📈' : '📉'}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `

    document.getElementById('scoreboard-content').innerHTML = content
  }

  update(deltaTime) {
    // Update all entities
    this.players.forEach(player => player.update(deltaTime))
    this.predictionOrbs.forEach(orb => orb.update(deltaTime))
    this.priceChart?.update(deltaTime)

    // Update timer
    if (this.matchState === 'prediction' && this.predictionDeadline) {
      const remaining = Math.max(0, this.predictionDeadline - Date.now() / 1000)
      const minutes = Math.floor(remaining / 60)
      const seconds = Math.floor(remaining % 60)

      this.game.ui.update('timer', {
        text: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        color: remaining < 60 ? '#ef4444' : '#ffffff',
      })
    }

    // Update camera to follow local player
    if (this.localPlayer) {
      this.game.camera.setTarget(this.localPlayer.x, this.localPlayer.y)
    }
  }

  render(ctx) {
    // Background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 1920, 1080)

    // Price chart
    this.priceChart?.render(ctx, this.game.camera)

    // Prediction orbs
    this.predictionOrbs.forEach(orb => orb.render(ctx, this.game.camera))

    // Players
    this.players.forEach(player => this.renderPlayer(ctx, player))
  }

  renderPlayer(ctx, player) {
    const camera = this.game.camera
    const screenX = player.x - camera.x
    const screenY = player.y - camera.y

    ctx.save()

    // Draw player avatar
    ctx.fillStyle = player.color
    ctx.beginPath()
    ctx.arc(screenX, screenY, player.size / 2, 0, Math.PI * 2)
    ctx.fill()

    // Draw username
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Inter'
    ctx.textAlign = 'center'
    ctx.fillText(player.username, screenX, screenY - player.size)

    // Draw level badge
    ctx.fillStyle = player.getLevelBadgeColor()
    ctx.fillRect(screenX - 20, screenY + player.size - 10, 40, 20)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px Inter'
    ctx.fillText(`Lv ${player.level}`, screenX, screenY + player.size + 4)

    // Draw prediction indicator
    if (player.hasPredicted) {
      ctx.font = '24px Arial'
      ctx.fillText(player.prediction === 'higher' ? '📈' : '📉', screenX, screenY + 20)
    }

    // Draw emote
    if (player.showEmote) {
      ctx.font = '32px Arial'
      ctx.fillText(player.showEmote, screenX, screenY - player.size - 20)
    }

    // Draw chat bubble
    if (player.chatBubble) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(screenX - 75, screenY - player.size - 50, 150, 30)
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Inter'
      ctx.textAlign = 'center'
      ctx.fillText(player.chatBubble.slice(0, 25), screenX, screenY - player.size - 30)
    }

    ctx.restore()
  }

  destroy() {
    // Cleanup
    this.game.network.send('unsubscribe-price', { matchId: this.matchId })
    this.game.ui.removeAll()
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Arena
}
