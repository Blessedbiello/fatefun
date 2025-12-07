/**
 * PriceChart Entity
 * Real-time price chart display in the arena
 */

class PriceChart {
  constructor(data) {
    this.id = 'price-chart'
    this.marketSymbol = data.marketSymbol || 'SOL/USD'

    // Position and size
    this.x = data.x || 960 // Center of 1920 world
    this.y = data.y || 100
    this.width = 600
    this.height = 300

    // Price data
    this.priceHistory = [] // Array of {time, price}
    this.currentPrice = data.startingPrice || 0
    this.startingPrice = data.startingPrice || 0
    this.maxDataPoints = 60 // Keep last 60 data points

    // Visual
    this.lineColor = '#a855f7' // Purple
    this.higherZoneColor = 'rgba(16, 185, 129, 0.1)' // Green
    this.lowerZoneColor = 'rgba(239, 68, 68, 0.1)' // Red
    this.startLineColor = '#f59e0b' // Yellow

    // Animation
    this.animationProgress = 0
    this.targetPrice = this.currentPrice

    // Auto-update
    this.lastUpdate = Date.now()
    this.updateInterval = 1000 // Update every second
  }

  // Add new price point
  addPricePoint(price, timestamp = Date.now()) {
    this.targetPrice = price

    this.priceHistory.push({
      time: timestamp,
      price: price,
    })

    // Keep only last N points
    if (this.priceHistory.length > this.maxDataPoints) {
      this.priceHistory.shift()
    }

    this.lastUpdate = Date.now()
  }

  // Update chart
  update(deltaTime) {
    // Animate price changes smoothly
    if (this.currentPrice !== this.targetPrice) {
      const diff = this.targetPrice - this.currentPrice
      this.currentPrice += diff * deltaTime * 5 // Smooth interpolation
    }
  }

  // Render the chart
  render(ctx, camera) {
    const screenX = this.x - camera.x
    const screenY = this.y - camera.y

    ctx.save()

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(screenX - this.width/2, screenY, this.width, this.height)

    // Draw border
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.strokeRect(screenX - this.width/2, screenY, this.width, this.height)

    if (this.priceHistory.length < 2) {
      // Not enough data to draw chart
      ctx.fillStyle = '#9ca3af'
      ctx.font = '16px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('Waiting for price data...', screenX, screenY + this.height/2)
      ctx.restore()
      return
    }

    // Calculate price range
    const prices = this.priceHistory.map(p => p.price)
    const minPrice = Math.min(...prices, this.startingPrice)
    const maxPrice = Math.max(...prices, this.startingPrice)
    const priceRange = maxPrice - minPrice || 1

    // Helper to convert price to Y coordinate
    const priceToY = (price) => {
      const normalized = (price - minPrice) / priceRange
      return screenY + this.height - (normalized * (this.height - 40)) - 20
    }

    // Draw higher/lower zones
    const startPriceY = priceToY(this.startingPrice)

    // Higher zone (above starting price)
    ctx.fillStyle = this.higherZoneColor
    ctx.fillRect(
      screenX - this.width/2,
      screenY,
      this.width,
      startPriceY - screenY
    )

    // Lower zone (below starting price)
    ctx.fillStyle = this.lowerZoneColor
    ctx.fillRect(
      screenX - this.width/2,
      startPriceY,
      this.width,
      screenY + this.height - startPriceY
    )

    // Draw starting price line
    ctx.strokeStyle = this.startLineColor
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(screenX - this.width/2, startPriceY)
    ctx.lineTo(screenX + this.width/2, startPriceY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw price line
    ctx.strokeStyle = this.lineColor
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()

    this.priceHistory.forEach((point, index) => {
      const x = screenX - this.width/2 + (index / (this.maxDataPoints - 1)) * this.width
      const y = priceToY(point.price)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw current price indicator
    const currentY = priceToY(this.currentPrice)
    ctx.fillStyle = this.lineColor
    ctx.beginPath()
    ctx.arc(screenX + this.width/2, currentY, 6, 0, Math.PI * 2)
    ctx.fill()

    // Draw labels
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Inter'
    ctx.textAlign = 'left'

    // Starting price label
    ctx.fillText(
      `Start: $${this.startingPrice.toFixed(2)}`,
      screenX - this.width/2 + 10,
      startPriceY - 10
    )

    // Current price label
    const priceChange = this.currentPrice - this.startingPrice
    const priceChangePercent = (priceChange / this.startingPrice) * 100
    ctx.textAlign = 'right'
    ctx.fillStyle = priceChange >= 0 ? '#10b981' : '#ef4444'
    ctx.fillText(
      `$${this.currentPrice.toFixed(2)} (${priceChange >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%)`,
      screenX + this.width/2 - 10,
      screenY + 20
    )

    // Market symbol
    ctx.textAlign = 'left'
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px Inter'
    ctx.fillText(this.marketSymbol, screenX - this.width/2 + 10, screenY + 20)

    ctx.restore()
  }

  // Get current trend
  getTrend() {
    if (this.priceHistory.length < 2) return 'neutral'

    const recent = this.priceHistory.slice(-5)
    const avgRecent = recent.reduce((sum, p) => sum + p.price, 0) / recent.length

    if (avgRecent > this.startingPrice * 1.01) return 'higher'
    if (avgRecent < this.startingPrice * 0.99) return 'lower'
    return 'neutral'
  }

  // Serialize for network
  serialize() {
    return {
      marketSymbol: this.marketSymbol,
      currentPrice: this.currentPrice,
      startingPrice: this.startingPrice,
      priceHistory: this.priceHistory.slice(-10), // Only send last 10 for bandwidth
    }
  }

  static deserialize(data) {
    const chart = new PriceChart({
      marketSymbol: data.marketSymbol,
      startingPrice: data.startingPrice,
    })
    chart.currentPrice = data.currentPrice
    chart.priceHistory = data.priceHistory || []
    return chart
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PriceChart
}
