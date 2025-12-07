/**
 * Scoreboard UI Component
 * Live scoreboard showing player predictions
 */

class Scoreboard {
  constructor(game, options = {}) {
    this.game = game
    this.x = options.x || 1600
    this.y = options.y || 20
    this.width = 300
    this.height = 400

    // Data
    this.players = []
    this.higherCount = 0
    this.lowerCount = 0
  }

  update(players) {
    this.players = Array.from(players.values())
    this.higherCount = this.players.filter(p => p.prediction === 'higher').length
    this.lowerCount = this.players.filter(p => p.prediction === 'lower').length
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x
    const screenY = this.y - camera.y

    ctx.save()

    // Background panel
    ctx.fillStyle = 'rgba(17, 24, 39, 0.9)'
    ctx.fillRect(screenX, screenY, this.width, this.height)

    // Border
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.strokeRect(screenX, screenY, this.width, this.height)

    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px Inter'
    ctx.textAlign = 'left'
    ctx.fillText('Predictions', screenX + 16, screenY + 30)

    // Higher/Lower counts
    const countY = screenY + 60

    // HIGHER bar
    const totalPredictions = this.higherCount + this.lowerCount || 1
    const higherPercent = (this.higherCount / totalPredictions) * 100

    ctx.fillStyle = '#10b981'
    ctx.fillRect(screenX + 16, countY, this.width - 32, 30)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(
      screenX + 16 + ((this.width - 32) * higherPercent / 100),
      countY,
      (this.width - 32) * (100 - higherPercent) / 100,
      30
    )

    // HIGHER label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Inter'
    ctx.fillText('📈 HIGHER', screenX + 24, countY + 20)
    ctx.textAlign = 'right'
    ctx.fillText(`${this.higherCount}`, screenX + this.width - 24, countY + 20)

    // LOWER bar
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(screenX + 16, countY + 40, this.width - 32, 30)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(
      screenX + 16,
      countY + 40,
      (this.width - 32) * higherPercent / 100,
      30
    )

    // LOWER label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Inter'
    ctx.fillText('📉 LOWER', screenX + 24, countY + 60)
    ctx.textAlign = 'right'
    ctx.fillText(`${this.lowerCount}`, screenX + this.width - 24, countY + 60)

    // Divider
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(screenX + 16, countY + 90)
    ctx.lineTo(screenX + this.width - 16, countY + 90)
    ctx.stroke()

    // Player list
    ctx.textAlign = 'left'
    let playerY = countY + 110

    this.players.forEach((player, index) => {
      if (playerY > screenY + this.height - 20) return // Don't overflow

      // Player avatar circle
      ctx.fillStyle = player.color
      ctx.beginPath()
      ctx.arc(screenX + 28, playerY, 12, 0, Math.PI * 2)
      ctx.fill()

      // Player username
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Inter'
      ctx.fillText(
        player.username.slice(0, 15),
        screenX + 48,
        playerY + 4
      )

      // Prediction icon
      if (player.hasPredicted) {
        ctx.font = '16px Arial'
        ctx.textAlign = 'right'
        ctx.fillText(
          player.prediction === 'higher' ? '📈' : '📉',
          screenX + this.width - 16,
          playerY + 4
        )
      }

      playerY += 30
    })

    ctx.restore()
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Scoreboard
}
