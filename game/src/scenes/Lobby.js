/**
 * Lobby Scene
 * Pre-match waiting room where players gather before the game starts
 */

class Lobby {
  constructor(game) {
    this.game = game
    this.name = 'Lobby'

    // Match info
    this.matchId = null
    this.marketName = 'SOL/USD'
    this.entryFee = 0.1
    this.maxPlayers = 10

    // Player management
    this.players = new Map()
    this.readyPlayers = new Set()
    this.localPlayer = null

    // Countdown
    this.countdown = null
    this.countdownStartTime = null
    this.countdownDuration = 30 // 30 seconds

    // Chat
    this.chatMessages = []
    this.maxChatMessages = 50

    // UI state
    this.isReady = false
  }

  init(data) {
    this.matchId = data.matchId
    this.marketName = data.marketName || 'SOL/USD'
    this.entryFee = data.entryFee || 0.1
    this.maxPlayers = data.maxPlayers || 10

    // Setup camera
    this.game.camera.setPosition(960, 540) // Center of world
    this.game.camera.zoom = 1

    // Add UI
    this.setupUI()

    // Listen for events
    this.setupEventListeners()
  }

  setupUI() {
    // Match info panel
    this.game.ui.add({
      id: 'match-info',
      type: 'panel',
      x: 20,
      y: 20,
      width: 300,
      height: 150,
      content: this.getMatchInfoHTML(),
    })

    // Player list
    this.game.ui.add({
      id: 'player-list',
      type: 'panel',
      x: 20,
      y: 190,
      width: 300,
      height: 400,
      content: '<div id="player-list-content"></div>',
    })

    // Ready button
    this.game.ui.add({
      id: 'ready-button',
      type: 'button',
      x: 20,
      y: 610,
      width: 300,
      height: 60,
      label: 'Ready Up',
      onClick: () => this.toggleReady(),
    })

    // Chat
    this.game.ui.add({
      id: 'lobby-chat',
      type: 'chat',
      x: 1920 - 420,
      y: 20,
      width: 400,
      height: 600,
    })

    // Leave button
    this.game.ui.add({
      id: 'leave-button',
      type: 'button',
      x: 1920 - 220,
      y: 640,
      width: 200,
      height: 40,
      label: 'Leave Match',
      onClick: () => this.leaveMatch(),
      style: 'danger',
    })
  }

  setupEventListeners() {
    // Player joined
    this.game.on('player-joined', (player) => {
      this.addPlayer(player)
      this.addChatMessage({
        type: 'system',
        message: `${player.username} joined the match`,
      })
    })

    // Player left
    this.game.on('player-left', (playerId) => {
      const player = this.players.get(playerId)
      if (player) {
        this.addChatMessage({
          type: 'system',
          message: `${player.username} left the match`,
        })
        this.players.delete(playerId)
        this.readyPlayers.delete(playerId)
      }
    })

    // Player ready status changed
    this.game.on('player-ready', ({ playerId, isReady }) => {
      if (isReady) {
        this.readyPlayers.add(playerId)
      } else {
        this.readyPlayers.delete(playerId)
      }
      this.updatePlayerList()
      this.checkStartConditions()
    })

    // Match starting
    this.game.on('match-starting', (data) => {
      this.startCountdown(data.countdown || this.countdownDuration)
    })

    // Chat message
    this.game.on('chat-message', (message) => {
      this.addChatMessage(message)
    })
  }

  addPlayer(player) {
    this.players.set(player.id, player)

    if (player.id === this.game.localPlayerId) {
      this.localPlayer = player
    }

    this.updatePlayerList()
  }

  toggleReady() {
    this.isReady = !this.isReady

    // Send to server
    this.game.network.send('player-ready', {
      isReady: this.isReady,
    })

    // Update UI
    const button = this.game.ui.get('ready-button')
    button.label = this.isReady ? 'Cancel Ready' : 'Ready Up'
    button.style = this.isReady ? 'success' : 'primary'
  }

  checkStartConditions() {
    const minPlayers = 2
    const allReady = this.players.size >= minPlayers &&
                     this.players.size === this.readyPlayers.size

    if (allReady) {
      this.game.network.send('lobby-ready-to-start')
    }
  }

  startCountdown(duration) {
    this.countdown = duration
    this.countdownStartTime = Date.now()

    this.addChatMessage({
      type: 'system',
      message: `Match starting in ${duration} seconds!`,
    })
  }

  updatePlayerList() {
    const listHTML = Array.from(this.players.values())
      .map(player => {
        const isReady = this.readyPlayers.has(player.id)
        const readyIcon = isReady ? '✓' : '○'
        const readyColor = isReady ? '#10b981' : '#6b7280'

        return `
          <div class="player-item" style="
            display: flex;
            align-items: center;
            padding: 8px;
            margin-bottom: 4px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
          ">
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${player.color};
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              margin-right: 12px;
            ">
              ${player.username.charAt(0).toUpperCase()}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 500; color: white;">${player.username}</div>
              <div style="font-size: 12px; color: #9ca3af;">
                Lv ${player.level} • ${player.tier}
              </div>
            </div>
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${readyColor};
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
            ">
              ${readyIcon}
            </div>
          </div>
        `
      })
      .join('')

    document.getElementById('player-list-content').innerHTML = `
      <div style="padding: 12px;">
        <div style="color: #9ca3af; font-size: 12px; margin-bottom: 12px;">
          Players: ${this.players.size}/${this.maxPlayers}
        </div>
        ${listHTML}
      </div>
    `
  }

  getMatchInfoHTML() {
    return `
      <div style="padding: 16px;">
        <h2 style="color: white; margin: 0 0 16px 0; font-size: 20px;">
          ${this.marketName}
        </h2>
        <div style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">
          Entry Fee: <span style="color: white; font-weight: bold;">${this.entryFee} SOL</span>
        </div>
        <div style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">
          Match ID: <span style="color: white; font-family: monospace;">${this.matchId?.toString().slice(0, 8) || 'N/A'}</span>
        </div>
        <div style="color: #9ca3af; font-size: 14px;">
          Status: <span style="color: #f59e0b; font-weight: bold;">WAITING</span>
        </div>
      </div>
    `
  }

  addChatMessage(message) {
    this.chatMessages.push(message)

    if (this.chatMessages.length > this.maxChatMessages) {
      this.chatMessages.shift()
    }

    // Update chat UI
    this.game.ui.updateChat('lobby-chat', message)
  }

  leaveMatch() {
    if (confirm('Are you sure you want to leave this match?')) {
      this.game.network.send('leave-match')
      this.game.changeScene('menu')
    }
  }

  update(deltaTime) {
    // Update countdown
    if (this.countdown !== null && this.countdownStartTime !== null) {
      const elapsed = (Date.now() - this.countdownStartTime) / 1000
      const remaining = Math.max(0, this.countdown - elapsed)

      if (remaining === 0) {
        // Transition to arena
        this.game.changeScene('arena')
      } else {
        // Update countdown display
        this.game.ui.update('countdown-display', {
          text: `Starting in ${Math.ceil(remaining)}...`,
        })
      }
    }
  }

  render(ctx) {
    // Clear background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 1920, 1080)

    // Draw FATE Protocol logo
    ctx.fillStyle = 'rgba(168, 85, 247, 0.1)'
    ctx.font = 'bold 72px Inter'
    ctx.textAlign = 'center'
    ctx.fillText('FATE PROTOCOL', 960, 300)

    // Draw waiting message
    ctx.fillStyle = '#9ca3af'
    ctx.font = '24px Inter'
    ctx.textAlign = 'center'
    ctx.fillText('Waiting for players...', 960, 400)

    // Draw countdown if active
    if (this.countdown !== null && this.countdownStartTime !== null) {
      const elapsed = (Date.now() - this.countdownStartTime) / 1000
      const remaining = Math.max(0, this.countdown - elapsed)

      ctx.fillStyle = '#f59e0b'
      ctx.font = 'bold 48px Inter'
      ctx.fillText(`Starting in ${Math.ceil(remaining)}`, 960, 500)
    }
  }

  destroy() {
    // Cleanup
    this.game.ui.remove('match-info')
    this.game.ui.remove('player-list')
    this.game.ui.remove('ready-button')
    this.game.ui.remove('lobby-chat')
    this.game.ui.remove('leave-button')
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Lobby
}
