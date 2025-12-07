/**
 * PredictionButtons UI Component
 * Large, animated prediction buttons with visual feedback
 */

class PredictionButtons {
  constructor(game, options = {}) {
    this.game = game
    this.x = options.x || 660
    this.y = options.y || 700
    this.width = 250
    this.height = 100
    this.gap = 30
    this.enabled = true
    this.hasPredicted = false

    // Animation state
    this.higherHover = false
    this.lowerHover = false
    this.higherScale = 1
    this.lowerScale = 1

    // Glow animation
    this.glowPhase = 0

    // Callbacks
    this.onPredict = options.onPredict || (() => {})
  }

  update(deltaTime) {
    // Smooth scale animations
    const targetHigherScale = this.higherHover && this.enabled ? 1.05 : 1
    const targetLowerScale = this.lowerHover && this.enabled ? 1.05 : 1

    this.higherScale += (targetHigherScale - this.higherScale) * deltaTime * 10
    this.lowerScale += (targetLowerScale - this.lowerScale) * deltaTime * 10

    // Glow pulse animation
    if (this.enabled && !this.hasPredicted) {
      this.glowPhase += deltaTime * 2 // 2 Hz pulse
    }
  }

  render(ctx, camera) {
    if (this.hasPredicted) return

    const screenX = this.x - camera.x
    const screenY = this.y - camera.y

    ctx.save()

    // HIGHER Button
    this.renderButton(ctx, {
      x: screenX,
      y: screenY,
      width: this.width,
      height: this.height,
      scale: this.higherScale,
      label: 'HIGHER',
      icon: '📈',
      gradient: ['#10b981', '#059669'],
      glowColor: '#10b981',
      enabled: this.enabled,
    })

    // LOWER Button
    this.renderButton(ctx, {
      x: screenX + this.width + this.gap,
      y: screenY,
      width: this.width,
      height: this.height,
      scale: this.lowerScale,
      label: 'LOWER',
      icon: '📉',
      gradient: ['#ef4444', '#dc2626'],
      glowColor: '#ef4444',
      enabled: this.enabled,
    })

    ctx.restore()
  }

  renderButton(ctx, opts) {
    const { x, y, width, height, scale, label, icon, gradient, glowColor, enabled } = opts

    const w = width * scale
    const h = height * scale
    const centerX = x + width / 2
    const centerY = y + height / 2
    const scaledX = centerX - w / 2
    const scaledY = centerY - h / 2

    ctx.save()

    // Glow effect (only when enabled)
    if (enabled) {
      const glowAlpha = 0.3 + Math.sin(this.glowPhase) * 0.2
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 20 * scale
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.globalAlpha = glowAlpha
    } else {
      ctx.globalAlpha = 0.5
    }

    // Button background gradient
    const gradientFill = ctx.createLinearGradient(scaledX, scaledY, scaledX, scaledY + h)
    gradientFill.addColorStop(0, gradient[0])
    gradientFill.addColorStop(1, gradient[1])

    ctx.fillStyle = gradientFill
    ctx.fillRect(scaledX, scaledY, w, h)

    // Border
    ctx.strokeStyle = enabled ? '#ffffff' : '#6b7280'
    ctx.lineWidth = 4 * scale
    ctx.strokeRect(scaledX, scaledY, w, h)

    // Reset alpha for text
    ctx.globalAlpha = enabled ? 1 : 0.5
    ctx.shadowBlur = 0

    // Icon
    ctx.font = `${40 * scale}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(icon, centerX, centerY - 15 * scale)

    // Label
    ctx.font = `bold ${24 * scale}px Inter`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, centerX, centerY + 20 * scale)

    ctx.restore()
  }

  handleClick(mouseX, mouseY, camera) {
    if (this.hasPredicted || !this.enabled) return

    const screenX = this.x - camera.x
    const screenY = this.y - camera.y

    // Check HIGHER button
    if (
      mouseX >= screenX &&
      mouseX <= screenX + this.width &&
      mouseY >= screenY &&
      mouseY <= screenY + this.height
    ) {
      this.onPredict('higher')
      this.hasPredicted = true
      this.enabled = false
      return
    }

    // Check LOWER button
    const lowerX = screenX + this.width + this.gap
    if (
      mouseX >= lowerX &&
      mouseX <= lowerX + this.width &&
      mouseY >= screenY &&
      mouseY <= screenY + this.height
    ) {
      this.onPredict('lower')
      this.hasPredicted = true
      this.enabled = false
    }
  }

  handleMouseMove(mouseX, mouseY, camera) {
    const screenX = this.x - camera.x
    const screenY = this.y - camera.y

    // Check HIGHER hover
    this.higherHover = (
      mouseX >= screenX &&
      mouseX <= screenX + this.width &&
      mouseY >= screenY &&
      mouseY <= screenY + this.height
    )

    // Check LOWER hover
    const lowerX = screenX + this.width + this.gap
    this.lowerHover = (
      mouseX >= lowerX &&
      mouseX <= lowerX + this.width &&
      mouseY >= screenY &&
      mouseY <= screenY + this.height
    )
  }

  disable() {
    this.enabled = false
  }

  enable() {
    this.enabled = true
  }

  reset() {
    this.hasPredicted = false
    this.enabled = true
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PredictionButtons
}
