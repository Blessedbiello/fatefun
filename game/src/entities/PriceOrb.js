/**
 * Price Orb Entity
 * Central orb showing current price with pulsing animations
 */

class PriceOrb {
  constructor(data) {
    this.id = 'price-orb'
    this.x = data.x || 960
    this.y = data.y || 540
    this.size = 120
    this.baseSize = 120

    // Price data
    this.currentPrice = data.startingPrice || 0
    this.startingPrice = data.startingPrice || 0
    this.targetPrice = this.currentPrice
    this.marketSymbol = data.marketSymbol || 'SOL/USD'

    // Animation
    this.pulsePhase = 0
    this.pulseScale = 1
    this.glowIntensity = 0
    this.rotationSpeed = 0

    // Color based on price movement
    this.color = '#a855f7' // Purple base
    this.glowColor = '#a855f7'

    // Price change effect
    this.priceChangeEffect = 0 // -1 to 1 scale
  }

  updatePrice(newPrice) {
    const oldPrice = this.currentPrice
    this.targetPrice = newPrice

    // Calculate price change magnitude
    const change = newPrice - oldPrice
    const changePercent = (change / oldPrice) * 100

    // Trigger visual effects based on change
    if (Math.abs(changePercent) > 0.5) {
      this.priceChangeEffect = Math.max(-1, Math.min(1, changePercent / 5))
      this.glowIntensity = Math.min(1, Math.abs(changePercent) / 2)
      this.rotationSpeed = changePercent > 0 ? 2 : -2
    }

    // Update color
    if (newPrice > this.startingPrice) {
      this.color = '#10b981' // Green
      this.glowColor = '#10b981'
    } else if (newPrice < this.startingPrice) {
      this.color = '#ef4444' // Red
      this.glowColor = '#ef4444'
    } else {
      this.color = '#a855f7' // Purple
      this.glowColor = '#a855f7'
    }
  }

  update(deltaTime) {
    // Smooth price interpolation
    if (this.currentPrice !== this.targetPrice) {
      const diff = this.targetPrice - this.currentPrice
      this.currentPrice += diff * deltaTime * 5
    }

    // Pulse animation
    this.pulsePhase += deltaTime * 2 // 2 Hz
    this.pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1

    // Decay effects
    this.priceChangeEffect *= (1 - deltaTime * 2)
    this.glowIntensity *= (1 - deltaTime * 1.5)
    this.rotationSpeed *= (1 - deltaTime * 2)

    // Update size based on pulse
    this.size = this.baseSize * this.pulseScale
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x
    const screenY = this.y - camera.y

    ctx.save()

    // Outer glow (intensifies with price changes)
    if (this.glowIntensity > 0) {
      const glowRadius = this.size * (1 + this.glowIntensity * 0.5)
      const gradient = ctx.createRadialGradient(
        screenX, screenY, this.size / 2,
        screenX, screenY, glowRadius
      )
      gradient.addColorStop(0, `${this.glowColor}40`)
      gradient.addColorStop(1, `${this.glowColor}00`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Main orb glow
    const gradient = ctx.createRadialGradient(
      screenX, screenY, 0,
      screenX, screenY, this.size / 2
    )
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.3, this.color)
    gradient.addColorStop(1, `${this.color}80`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2)
    ctx.fill()

    // Orb border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2)
    ctx.stroke()

    // Price text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px Inter'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#000000'
    ctx.shadowBlur = 10
    ctx.fillText(`$${this.currentPrice.toFixed(2)}`, screenX, screenY)

    // Market symbol below
    ctx.shadowBlur = 0
    ctx.font = '14px Inter'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(this.marketSymbol, screenX, screenY + 30)

    // Price change indicator
    const priceChange = this.currentPrice - this.startingPrice
    const changePercent = ((priceChange / this.startingPrice) * 100).toFixed(2)
    const changeText = `${priceChange >= 0 ? '+' : ''}${changePercent}%`
    ctx.font = 'bold 16px Inter'
    ctx.fillStyle = priceChange >= 0 ? '#10b981' : '#ef4444'
    ctx.fillText(changeText, screenX, screenY - 30)

    ctx.restore()
  }

  serialize() {
    return {
      currentPrice: this.currentPrice,
      startingPrice: this.startingPrice,
      marketSymbol: this.marketSymbol,
    }
  }

  static deserialize(data) {
    const orb = new PriceOrb({
      startingPrice: data.startingPrice,
      marketSymbol: data.marketSymbol,
    })
    orb.currentPrice = data.currentPrice
    orb.targetPrice = data.currentPrice
    return orb
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PriceOrb
}
