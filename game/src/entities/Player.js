/**
 * Player Entity
 * Represents a player in the FATE Protocol arena
 */

class Player {
  constructor(data) {
    this.id = data.id
    this.walletAddress = data.walletAddress
    this.username = data.username || this.truncateAddress(data.walletAddress)

    // Position and movement
    this.x = data.x || 0
    this.y = data.y || 0
    this.velocityX = 0
    this.velocityY = 0
    this.speed = 200 // pixels per second
    this.rotation = 0

    // Visual
    this.color = this.generateColor(data.walletAddress)
    this.level = data.level || 1
    this.tier = data.tier || 'Novice'
    this.size = 48 // Default avatar size

    // Game state
    this.prediction = null // 'higher' or 'lower'
    this.hasPredicted = false
    this.isAlive = true
    this.isSpectator = data.isSpectator || false

    // Stats
    this.entryFee = data.entryFee || 0
    this.currentStreak = data.currentStreak || 0
    this.winRate = data.winRate || 0

    // UI state
    this.showEmote = null
    this.emoteTimeout = null
    this.chatBubble = null
    this.chatTimeout = null

    // Network
    this.lastUpdate = Date.now()
    this.interpolate = true
  }

  // Generate deterministic color from wallet address
  generateColor(address) {
    const colors = [
      '#a855f7', // Purple
      '#3b82f6', // Blue
      '#ec4899', // Pink
      '#10b981', // Green
      '#f59e0b', // Yellow
    ]

    const hash = address.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0)
    }, 0)

    return colors[hash % colors.length]
  }

  truncateAddress(address) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  // Update player position
  update(deltaTime) {
    // Apply velocity
    this.x += this.velocityX * deltaTime
    this.y += this.velocityY * deltaTime

    // Keep within bounds
    this.x = Math.max(48, Math.min(1920 - 48, this.x))
    this.y = Math.max(48, Math.min(1080 - 48, this.y))

    // Update rotation to face movement direction
    if (this.velocityX !== 0 || this.velocityY !== 0) {
      this.rotation = Math.atan2(this.velocityY, this.velocityX)
    }
  }

  // Set movement direction
  setVelocity(vx, vy) {
    this.velocityX = vx * this.speed
    this.velocityY = vy * this.speed
  }

  // Make prediction
  predict(side) {
    if (this.hasPredicted || this.isSpectator) return false

    this.prediction = side // 'higher' or 'lower'
    this.hasPredicted = true
    this.playPredictionAnimation()
    return true
  }

  playPredictionAnimation() {
    // Trigger visual feedback
    this.emit('prediction-made', {
      playerId: this.id,
      prediction: this.prediction,
    })
  }

  // Show emote
  showEmoteIcon(emoteId) {
    if (this.emoteTimeout) clearTimeout(this.emoteTimeout)

    this.showEmote = emoteId
    this.emoteTimeout = setTimeout(() => {
      this.showEmote = null
    }, 3000)
  }

  // Show chat bubble
  showChat(message) {
    if (this.chatTimeout) clearTimeout(this.chatTimeout)

    this.chatBubble = message
    this.chatTimeout = setTimeout(() => {
      this.chatBubble = null
    }, 5000)
  }

  // Win/lose state
  setWinner(isWinner) {
    this.isWinner = isWinner
    this.playResultAnimation(isWinner)
  }

  playResultAnimation(isWinner) {
    this.emit('result', {
      playerId: this.id,
      isWinner,
    })
  }

  // Serialize for network
  serialize() {
    return {
      id: this.id,
      walletAddress: this.walletAddress,
      username: this.username,
      x: Math.round(this.x),
      y: Math.round(this.y),
      rotation: this.rotation,
      color: this.color,
      level: this.level,
      tier: this.tier,
      prediction: this.prediction,
      hasPredicted: this.hasPredicted,
      isSpectator: this.isSpectator,
      showEmote: this.showEmote,
      chatBubble: this.chatBubble,
    }
  }

  // Deserialize from network
  static deserialize(data) {
    return new Player(data)
  }

  // Get level badge color
  getLevelBadgeColor() {
    const tierColors = {
      'Novice': '#6b7280',
      'Apprentice': '#10b981',
      'Predictor': '#3b82f6',
      'Oracle': '#a855f7',
      'Sage': '#f59e0b',
      'Legend': '#ef4444',
      'Mythic': '#ec4899',
    }
    return tierColors[this.tier] || '#6b7280'
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player
}
