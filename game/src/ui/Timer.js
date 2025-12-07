/**
 * Timer UI Component
 * Large countdown timer with urgency effects
 */

class Timer {
  constructor(game, options = {}) {
    this.game = game
    this.x = options.x || 960
    this.y = options.y || 450
    this.fontSize = options.fontSize || 72
    this.color = '#ffffff'

    // Timer state
    this.endTime = null
    this.remaining = 0

    // Animation
    this.scale = 1
    this.pulsePhase = 0
    this.shakeOffset = { x: 0, y: 0 }
  }

  setEndTime(endTime) {
    this.endTime = endTime
  }

  update(deltaTime) {
    if (!this.endTime) return

    this.remaining = Math.max(0, this.endTime - Date.now() / 1000)

    // Urgency effects when < 10 seconds
    if (this.remaining < 10 && this.remaining > 0) {
      // Pulse animation (faster as time runs out)
      const pulseSpeed = 5 + (10 - this.remaining) // Speeds up
      this.pulsePhase += deltaTime * pulseSpeed
      this.scale = 1 + Math.sin(this.pulsePhase) * 0.1

      // Screen shake effect (intensifies)
      const shakeIntensity = (10 - this.remaining) * 2
      this.shakeOffset.x = (Math.random() - 0.5) * shakeIntensity
      this.shakeOffset.y = (Math.random() - 0.5) * shakeIntensity

      // Color transitions: white -> yellow -> red
      if (this.remaining < 3) {
        this.color = '#ef4444' // Red
      } else if (this.remaining < 5) {
        this.color = '#f59e0b' // Yellow
      } else {
        this.color = '#ffffff' // White
      }
    } else {
      // Normal state
      this.scale = 1
      this.shakeOffset = { x: 0, y: 0 }
      this.color = '#ffffff'
    }
  }

  render(ctx, camera) {
    if (!this.endTime) return

    const minutes = Math.floor(this.remaining / 60)
    const seconds = Math.floor(this.remaining % 60)
    const text = `${minutes}:${seconds.toString().padStart(2, '0')}`

    ctx.save()

    const screenX = this.x - camera.x + this.shakeOffset.x
    const screenY = this.y - camera.y + this.shakeOffset.y

    // Glow effect when urgent
    if (this.remaining < 10 && this.remaining > 0) {
      ctx.shadowColor = this.color
      ctx.shadowBlur = 40 * this.scale
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }

    // Timer text
    ctx.font = `bold ${this.fontSize * this.scale}px Inter`
    ctx.fillStyle = this.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, screenX, screenY)

    // Label below
    ctx.shadowBlur = 0
    ctx.font = '24px Inter'
    ctx.fillStyle = '#9ca3af'
    ctx.fillText(this.remaining < 10 ? 'HURRY!' : 'Time Remaining', screenX, screenY + 60)

    ctx.restore()
  }

  getShakeOffset() {
    // Return shake offset for camera shake effect
    return this.shakeOffset
  }

  isUrgent() {
    return this.remaining < 10 && this.remaining > 0
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Timer
}
