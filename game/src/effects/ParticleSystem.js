/**
 * Particle System
 * Handles visual effects like confetti, explosions, sparkles
 */

class Particle {
  constructor(x, y, options = {}) {
    this.x = x
    this.y = y
    this.vx = options.vx || (Math.random() - 0.5) * 400
    this.vy = options.vy || (Math.random() - 0.5) * 400
    this.ax = options.ax || 0
    this.ay = options.ay || 500 // Gravity
    this.lifetime = options.lifetime || 2000
    this.age = 0
    this.color = options.color || '#ffffff'
    this.size = options.size || 8
    this.rotation = Math.random() * Math.PI * 2
    this.rotationSpeed = (Math.random() - 0.5) * 10
    this.shape = options.shape || 'square' // 'square', 'circle', 'star'
    this.alpha = 1
  }

  update(deltaTime) {
    this.age += deltaTime * 1000

    // Physics
    this.vx += this.ax * deltaTime
    this.vy += this.ay * deltaTime
    this.x += this.vx * deltaTime
    this.y += this.vy * deltaTime
    this.rotation += this.rotationSpeed * deltaTime

    // Fade out near end of life
    const lifePercent = this.age / this.lifetime
    if (lifePercent > 0.7) {
      this.alpha = 1 - ((lifePercent - 0.7) / 0.3)
    }

    return this.age < this.lifetime
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x
    const screenY = this.y - camera.y

    ctx.save()
    ctx.globalAlpha = this.alpha
    ctx.translate(screenX, screenY)
    ctx.rotate(this.rotation)

    if (this.shape === 'square') {
      ctx.fillStyle = this.color
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)
    } else if (this.shape === 'circle') {
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (this.shape === 'star') {
      this.drawStar(ctx, 0, 0, 5, this.size, this.size / 2)
      ctx.fillStyle = this.color
      ctx.fill()
    }

    ctx.restore()
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }

    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
  }
}

class ParticleSystem {
  constructor(game) {
    this.game = game
    this.particles = []
  }

  // Confetti explosion (for winners)
  createConfetti(x, y, count = 100) {
    const colors = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = 200 + Math.random() * 300
      const particle = new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 200, // Upward bias
        ay: 600, // Gravity
        lifetime: 2000 + Math.random() * 1000,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 6,
        shape: ['square', 'circle', 'star'][Math.floor(Math.random() * 3)],
      })
      this.particles.push(particle)
    }
  }

  // Sparkles (for prediction orbs)
  createSparkles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 100
      const particle = new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ax: 0,
        ay: 0,
        lifetime: 500 + Math.random() * 500,
        color: color,
        size: 3 + Math.random() * 3,
        shape: 'star',
      })
      this.particles.push(particle)
    }
  }

  // Explosion (for price orb reactions)
  createExplosion(x, y, color, count = 30) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = 150 + Math.random() * 200
      const particle = new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ax: 0,
        ay: 200,
        lifetime: 1000 + Math.random() * 500,
        color: color,
        size: 4 + Math.random() * 4,
        shape: 'circle',
      })
      this.particles.push(particle)
    }
  }

  // Trail effect (for moving players)
  createTrail(x, y, color) {
    const particle = new Particle(x, y, {
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0,
      lifetime: 300,
      color: color,
      size: 12,
      shape: 'circle',
    })
    this.particles.push(particle)
  }

  update(deltaTime) {
    this.particles = this.particles.filter(particle => particle.update(deltaTime))
  }

  render(ctx, camera) {
    this.particles.forEach(particle => particle.render(ctx, camera))
  }

  clear() {
    this.particles = []
  }

  getParticleCount() {
    return this.particles.length
  }
}

// Export for Moddio
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParticleSystem
}
