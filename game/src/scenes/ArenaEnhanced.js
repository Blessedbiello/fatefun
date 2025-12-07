/**
 * Arena Scene (Enhanced)
 * Main gameplay with visual polish and effects
 */

const Player = require('../entities/Player')
const PredictionOrb = require('../entities/PredictionOrb')
const PriceChart = require('../entities/PriceChart')
const PriceOrb = require('../entities/PriceOrb')
const ParticleSystem = require('../effects/ParticleSystem')
const PredictionButtons = require('../ui/PredictionButtons')
const Timer = require('../ui/Timer')
const Scoreboard = require('../ui/Scoreboard')

class ArenaEnhanced {
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
    this.priceOrb = null

    // Visual effects
    this.particleSystem = new ParticleSystem(game)
    this.predictionButtons = null
    this.timer = null
    this.scoreboard = null

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
    this.cameraShake = { x: 0, y: 0 }

    // Chat sidebar
    this.chatMessages = []
    this.showChat = true
  }

  init(data) {
    this.matchId = data.matchId
    this.marketName = data.marketName
    this.startingPrice = data.startingPrice
    this.currentPrice = data.startingPrice
    this.predictionDeadline = data.predictionDeadline
    this.resolutionTime = data.resolutionTime

    // Create central price orb
    this.priceOrb = new PriceOrb({
      x: 960,
      y: 540,
      startingPrice: this.startingPrice,
      marketSymbol: this.marketName,
    })

    // Create price chart (top)
    this.priceChart = new PriceChart({
      x: 960,
      y: 150,
      marketSymbol: this.marketName,
      startingPrice: this.startingPrice,
    })

    // Create UI components
    this.predictionButtons = new PredictionButtons(this.game, {
      x: 660,
      y: 850,
      onPredict: (side) => this.predict(side),
    })

    this.timer = new Timer(this.game, {
      x: 960,
      y: 720,
      fontSize: 72,
    })
    this.timer.setEndTime(this.predictionDeadline)

    this.scoreboard = new Scoreboard(this.game, {
      x: 1600,
      y: 20,
    })

    // Setup event listeners
    this.setupEventListeners()

    // Start price updates
    this.startPriceUpdates()

    // Position players in a circle around the orb
    this.arrangePlayersInCircle()
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
      this.priceOrb.updatePrice(data.price)
      this.priceChart.addPricePoint(data.price, data.timestamp)

      // Create explosion effect on significant changes
      const change = Math.abs((data.price - this.startingPrice) / this.startingPrice)
      if (change > 0.02) { // > 2% change
        const color = data.price > this.startingPrice ? '#10b981' : '#ef4444'
        this.particleSystem.createExplosion(this.priceOrb.x, this.priceOrb.y, color, 20)
      }
    })

    // Match state changes
    this.game.on('match-state-change', (state) => {
      this.matchState = state
      this.onStateChange(state)
    })

    // Chat messages
    this.game.on('chat-message', (data) => this.addChatMessage(data))

    // Emotes
    this.game.on('player-emote', (data) => this.onPlayerEmote(data))

    // Keyboard controls
    this.game.input.on('keydown', (key) => this.handleInput(key))

    // Mouse controls
    this.game.input.on('click', (x, y) => {
      this.predictionButtons.handleClick(x, y, this.game.camera)
    })

    this.game.input.on('mousemove', (x, y) => {
      this.predictionButtons.handleMouseMove(x, y, this.game.camera)
    })
  }

  startPriceUpdates() {
    // Subscribe to Solana price feed via network layer
    this.game.network.send('subscribe-price', {
      matchId: this.matchId,
    })
  }

  arrangePlayersInCircle() {
    const radius = 350
    const centerX = 960
    const centerY = 540
    const playerCount = this.players.size

    Array.from(this.players.values()).forEach((player, index) => {
      const angle = (Math.PI * 2 * index) / playerCount - Math.PI / 2
      player.x = centerX + Math.cos(angle) * radius
      player.y = centerY + Math.sin(angle) * radius
    })
  }

  addPlayer(playerData) {
    const player = new Player(playerData)
    this.players.set(player.id, player)

    if (player.id === this.game.localPlayerId) {
      this.localPlayer = player
    }

    this.arrangePlayersInCircle()
    this.scoreboard.update(this.players)

    // Welcome sparkles
    this.particleSystem.createSparkles(player.x, player.y, player.color, 15)

    // Add chat message
    this.addChatMessage({
      type: 'system',
      message: `${player.username} joined`,
    })
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId)
    if (player) {
      this.addChatMessage({
        type: 'system',
        message: `${player.username} left`,
      })
    }

    this.players.delete(playerId)
    this.predictionOrbs.delete(playerId)
    this.arrangePlayersInCircle()
    this.scoreboard.update(this.players)
  }

  updatePlayerPosition(data) {
    const player = this.players.get(data.playerId)
    if (player) {
      player.x = data.x
      player.y = data.y
      player.rotation = data.rotation

      // Trail effect for moving players
      if (Math.abs(player.velocityX) > 10 || Math.abs(player.velocityY) > 10) {
        if (Math.random() < 0.3) { // 30% chance per frame
          this.particleSystem.createTrail(player.x, player.y, player.color)
        }
      }
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

    // Visual effects
    const color = side === 'higher' ? '#10b981' : '#ef4444'
    this.particleSystem.createSparkles(this.localPlayer.x, this.localPlayer.y, color, 20)

    // Disable buttons
    this.predictionButtons.disable()

    // Play sound
    this.game.sounds.play('predict')

    // Update scoreboard
    this.scoreboard.update(this.players)
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

      // Visual effects
      const color = data.prediction === 'higher' ? '#10b981' : '#ef4444'
      this.particleSystem.createSparkles(player.x, player.y, color, 15)
    }

    this.scoreboard.update(this.players)
  }

  onPlayerEmote(data) {
    const player = this.players.get(data.playerId)
    if (player) {
      player.showEmoteIcon(data.emote)
    }
  }

  addChatMessage(data) {
    this.chatMessages.push({
      timestamp: Date.now(),
      ...data,
    })

    // Keep last 50 messages
    if (this.chatMessages.length > 50) {
      this.chatMessages.shift()
    }
  }

  onStateChange(state) {
    if (state === 'resolution') {
      this.predictionButtons.disable()
      this.addChatMessage({
        type: 'system',
        message: '⏱️ Resolution phase started!',
      })
    } else if (state === 'ended') {
      // Determine winners/losers
      const finalPrice = this.currentPrice
      const winningSide = finalPrice > this.startingPrice ? 'higher' : 'lower'

      this.players.forEach(player => {
        if (player.prediction === winningSide) {
          // Winner confetti!
          this.particleSystem.createConfetti(player.x, player.y, 80)
          this.game.sounds.play('win')
        } else if (player.hasPredicted) {
          this.game.sounds.play('lose')
        }
      })

      // Transition to results
      setTimeout(() => {
        this.game.changeScene('results', {
          matchId: this.matchId,
          finalPrice: finalPrice,
          startingPrice: this.startingPrice,
          winningSide: winningSide,
        })
      }, 4000) // 4 seconds to enjoy the confetti
    }
  }

  handleInput(key) {
    if (!this.localPlayer) return

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
      this.game.network.send('player-move', { vx, vy })
    }

    // Emote shortcuts (1-8)
    const emotes = ['😎', '🔥', '💀', '🚀', '😂', '😢', '🤔', '🎉']
    const emoteIndex = parseInt(key) - 1
    if (emoteIndex >= 0 && emoteIndex < emotes.length) {
      this.game.network.send('player-emote', { emote: emotes[emoteIndex] })
      this.localPlayer.showEmoteIcon(emotes[emoteIndex])
    }
  }

  update(deltaTime) {
    // Update all entities
    this.players.forEach(player => player.update(deltaTime))
    this.predictionOrbs.forEach(orb => orb.update(deltaTime))
    this.priceChart?.update(deltaTime)
    this.priceOrb?.update(deltaTime)

    // Update UI components
    this.predictionButtons?.update(deltaTime)
    this.timer?.update(deltaTime)
    this.scoreboard?.update(this.players)

    // Update particle effects
    this.particleSystem.update(deltaTime)

    // Camera shake from timer urgency
    if (this.timer?.isUrgent()) {
      this.cameraShake = this.timer.getShakeOffset()
    } else {
      this.cameraShake = { x: 0, y: 0 }
    }

    // Update camera (stays centered on orb)
    this.game.camera.setTarget(
      this.priceOrb.x + this.cameraShake.x,
      this.priceOrb.y + this.cameraShake.y
    )
  }

  render(ctx) {
    // Background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 1920, 1080)

    // Price chart (top)
    this.priceChart?.render(ctx, this.game.camera)

    // Particle effects (behind players)
    this.particleSystem.render(ctx, this.game.camera)

    // Prediction orbs
    this.predictionOrbs.forEach(orb => orb.render(ctx, this.game.camera))

    // Central price orb
    this.priceOrb?.render(ctx, this.game.camera)

    // Players (with glow effects)
    this.players.forEach(player => this.renderPlayer(ctx, player))

    // UI components
    this.predictionButtons?.render(ctx, this.game.camera)
    this.timer?.render(ctx, this.game.camera)
    this.scoreboard?.render(ctx, this.game.camera)

    // Chat sidebar
    if (this.showChat) {
      this.renderChat(ctx)
    }

    // Debug info
    if (this.game.debug) {
      this.renderDebug(ctx)
    }
  }

  renderPlayer(ctx, player) {
    const camera = this.game.camera
    const screenX = player.x - camera.x
    const screenY = player.y - camera.y

    ctx.save()

    // Glow effect (when predicted)
    if (player.glowIntensity > 0) {
      const glowColor = player.prediction === 'higher' ? '#10b981' : '#ef4444'
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 30 * player.glowIntensity
      ctx.globalAlpha = player.glowIntensity
    }

    // Draw player avatar
    ctx.fillStyle = player.color
    ctx.beginPath()
    ctx.arc(screenX, screenY, player.size / 2, 0, Math.PI * 2)
    ctx.fill()

    // Reset shadow
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1

    // Draw border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(screenX, screenY, player.size / 2, 0, Math.PI * 2)
    ctx.stroke()

    // Draw username
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Inter'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#000000'
    ctx.shadowBlur = 4
    ctx.fillText(player.username, screenX, screenY - player.size - 10)

    // Draw level badge
    const badgeColor = player.getLevelBadgeColor()
    ctx.shadowBlur = 0
    ctx.fillStyle = badgeColor
    ctx.fillRect(screenX - 20, screenY + player.size - 5, 40, 20)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px Inter'
    ctx.fillText(`Lv ${player.level}`, screenX, screenY + player.size + 8)

    // Draw prediction indicator
    if (player.hasPredicted) {
      ctx.font = '28px Arial'
      ctx.fillText(player.prediction === 'higher' ? '📈' : '📉', screenX, screenY + 15)
    }

    // Draw emote
    if (player.showEmote) {
      ctx.font = '36px Arial'
      ctx.fillText(player.showEmote, screenX, screenY - player.size - 40)
    }

    // Draw chat bubble
    if (player.chatBubble) {
      const bubbleWidth = 150
      const bubbleHeight = 35
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
      ctx.fillRect(screenX - bubbleWidth/2, screenY - player.size - 70, bubbleWidth, bubbleHeight)
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Inter'
      ctx.fillText(player.chatBubble.slice(0, 25), screenX, screenY - player.size - 45)
    }

    ctx.restore()
  }

  renderChat(ctx) {
    const x = 20
    const y = 700
    const width = 350
    const height = 360

    ctx.save()

    // Background
    ctx.fillStyle = 'rgba(17, 24, 39, 0.9)'
    ctx.fillRect(x, y, width, height)

    // Border
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)

    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Inter'
    ctx.textAlign = 'left'
    ctx.fillText('Chat', x + 12, y + 25)

    // Messages
    ctx.font = '12px Inter'
    let messageY = y + 50
    const recentMessages = this.chatMessages.slice(-15)

    recentMessages.forEach((msg) => {
      if (messageY > y + height - 20) return

      if (msg.type === 'system') {
        ctx.fillStyle = '#9ca3af'
        ctx.fillText(`• ${msg.message}`, x + 12, messageY)
      } else {
        ctx.fillStyle = '#ffffff'
        ctx.fillText(`${msg.username}:`, x + 12, messageY)
        ctx.fillStyle = '#d1d5db'
        ctx.fillText(msg.message.slice(0, 35), x + 12, messageY + 15)
        messageY += 15
      }

      messageY += 20
    })

    // Input hint
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px Inter'
    ctx.fillText('Press ENTER to chat, 1-8 for emotes', x + 12, y + height - 10)

    ctx.restore()
  }

  renderDebug(ctx) {
    ctx.save()
    ctx.fillStyle = '#00ff00'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'

    const debug = [
      `FPS: ${this.game.fps.toFixed(1)}`,
      `Players: ${this.players.size}`,
      `Particles: ${this.particleSystem.getParticleCount()}`,
      `State: ${this.matchState}`,
      `Price: $${this.currentPrice.toFixed(2)}`,
    ]

    debug.forEach((line, i) => {
      ctx.fillText(line, 10, 20 + i * 15)
    })

    ctx.restore()
  }

  destroy() {
    // Cleanup
    this.game.network.send('unsubscribe-price', { matchId: this.matchId })
    this.particleSystem.clear()
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArenaEnhanced
}
