/**
 * PredictionOrb Entity
 * Visual representation of a player's prediction (Higher/Lower orb)
 */

class PredictionOrb {
  constructor(data) {
    this.id = data.id
    this.playerId = data.playerId
    this.prediction = data.prediction // 'higher' or 'lower'

    // Position (spawns at player location)
    this.x = data.x
    this.y = data.y

    // Visual
    this.color = this.prediction === 'higher' ? '#10b981' : '#ef4444' // Green or Red
    this.size = 32
    this.glow = 0
    this.glowDirection = 1

    // Animation
    this.pulseScale = 1
    this.pulseSpeed = 2
    this.floatOffset = 0
    this.floatSpeed = 1.5

    // Lifetime
    this.createdAt = Date.now()
    this.lifetime = 60000 // 60 seconds
    this.alpha = 1

    // State
    this.isActive = true
  }

  update(deltaTime) {
    if (!this.isActive) return

    // Pulsing animation
    this.pulseScale = 1 + Math.sin(Date.now() / 1000 * this.pulseSpeed) * 0.1

    // Floating animation
    this.floatOffset = Math.sin(Date.now() / 1000 * this.floatSpeed) * 10

    // Glow animation
    this.glow += this.glowDirection * deltaTime * 100
    if (this.glow >= 255) {
      this.glow = 255
      this.glowDirection = -1
    } else if (this.glow <= 100) {
      this.glow = 100
      this.glowDirection = 1
    }

    // Fade out near end of lifetime
    const age = Date.now() - this.createdAt
    if (age > this.lifetime - 5000) {
      this.alpha = (this.lifetime - age) / 5000
    }

    // Destroy after lifetime
    if (age >= this.lifetime) {
      this.destroy()
    }
  }

  // Render the orb
  render(ctx, camera) {
    if (!this.isActive) return

    const screenX = this.x - camera.x
    const screenY = this.y - camera.y + this.floatOffset

    ctx.save()
    ctx.globalAlpha = this.alpha

    // Draw glow
    const gradient = ctx.createRadialGradient(
      screenX, screenY, 0,
      screenX, screenY, this.size * this.pulseScale * 2
    )
    gradient.addColorStop(0, this.color + 'ff')
    gradient.addColorStop(0.5, this.color + Math.floor(this.glow).toString(16).padStart(2, '0'))
    gradient.addColorStop(1, this.color + '00')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.size * this.pulseScale * 2, 0, Math.PI * 2)
    ctx.fill()

    // Draw orb body
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.size * this.pulseScale, 0, Math.PI * 2)
    ctx.fill()

    // Draw icon
    ctx.fillStyle = '#ffffff'
    ctx.font = `${this.size * 0.8}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.prediction === 'higher' ? '📈' : '📉', screenX, screenY)

    ctx.restore()
  }

  destroy() {
    this.isActive = false
    this.emit('destroyed', { orbId: this.id })
  }

  // Serialize for network
  serialize() {
    return {
      id: this.id,
      playerId: this.playerId,
      prediction: this.prediction,
      x: this.x,
      y: this.y,
      isActive: this.isActive,
    }
  }

  static deserialize(data) {
    return new PredictionOrb(data)
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PredictionOrb
}
