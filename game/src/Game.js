/**
 * FATE Protocol - Moddio Game Engine
 * Main game entry point
 */

const config = require('../moddio.config')
const Lobby = require('./scenes/Lobby')
const Arena = require('./scenes/Arena')
const Results = require('./scenes/Results')
const SolanaSync = require('./network/SolanaSync')

class FateGame {
  constructor(container) {
    this.container = container
    this.config = config

    // Core systems
    this.canvas = null
    this.ctx = null
    this.camera = null
    this.ui = null
    this.input = null
    this.network = null
    this.solanaSync = null

    // Scenes
    this.scenes = new Map()
    this.currentScene = null

    // Game state
    this.isRunning = false
    this.lastFrameTime = 0
    this.fps = 0

    // Local player
    this.localPlayerId = null

    // Event emitter
    this.events = new Map()
  }

  async initialize(wallet, connection, program) {
    // Create canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.config.world.width
    this.canvas.height = this.config.world.height
    this.container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')

    // Initialize systems
    this.camera = new Camera(this)
    this.ui = new UISystem(this)
    this.input = new InputSystem(this)
    this.network = new NetworkSystem(this, config.server)

    // Initialize Solana sync
    this.solanaSync = new SolanaSync(this, config)
    await this.solanaSync.initialize(wallet, connection, program)

    // Register scenes
    this.registerScene('lobby', Lobby)
    this.registerScene('arena', Arena)
    this.registerScene('results', Results)

    // Setup network handlers
    this.setupNetworkHandlers()

    console.log('🎮 FATE Protocol game initialized')
  }

  registerScene(name, SceneClass) {
    this.scenes.set(name, SceneClass)
  }

  changeScene(sceneName, data = {}) {
    // Cleanup current scene
    if (this.currentScene) {
      this.currentScene.destroy()
    }

    // Create new scene
    const SceneClass = this.scenes.get(sceneName)
    if (!SceneClass) {
      console.error('Scene not found:', sceneName)
      return
    }

    this.currentScene = new SceneClass(this)
    this.currentScene.init(data)

    console.log('🎬 Scene changed:', sceneName)
  }

  setupNetworkHandlers() {
    // Connect to Moddio server
    this.network.on('connected', () => {
      console.log('🌐 Connected to game server')
    })

    this.network.on('disconnected', () => {
      console.log('❌ Disconnected from game server')
      this.showDisconnectScreen()
    })

    // Player joined match
    this.network.on('match-joined', (data) => {
      this.localPlayerId = data.playerId
      this.changeScene('lobby', data)
    })

    // Forward events to current scene
    this.network.on('*', (event, data) => {
      this.emit(event, data)
    })
  }

  start() {
    if (this.isRunning) return

    this.isRunning = true
    this.lastFrameTime = performance.now()
    this.gameLoop()

    console.log('▶️ Game started')
  }

  stop() {
    this.isRunning = false
    console.log('⏸️ Game stopped')
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return

    // Calculate delta time
    const deltaTime = (currentTime - this.lastFrameTime) / 1000
    this.lastFrameTime = currentTime

    // Calculate FPS
    this.fps = 1 / deltaTime

    // Update
    this.update(deltaTime)

    // Render
    this.render()

    // Next frame
    requestAnimationFrame((time) => this.gameLoop(time))
  }

  update(deltaTime) {
    // Update current scene
    if (this.currentScene) {
      this.currentScene.update(deltaTime)
    }

    // Update camera
    this.camera.update(deltaTime)

    // Update UI
    this.ui.update(deltaTime)
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Render current scene
    if (this.currentScene) {
      this.currentScene.render(this.ctx)
    }

    // Render UI
    this.ui.render(this.ctx)

    // Render debug info
    if (this.config.debug.enabled && this.config.debug.showFPS) {
      this.renderDebugInfo()
    }
  }

  renderDebugInfo() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(10, 10, 150, 60)

    this.ctx.fillStyle = '#00ff00'
    this.ctx.font = '14px monospace'
    this.ctx.fillText(`FPS: ${Math.round(this.fps)}`, 20, 30)
    this.ctx.fillText(`Players: ${this.currentScene?.players?.size || 0}`, 20, 50)
  }

  showDisconnectScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 48px Inter'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('Disconnected', this.canvas.width / 2, this.canvas.height / 2)

    this.ctx.font = '24px Inter'
    this.ctx.fillText('Reconnecting...', this.canvas.width / 2, this.canvas.height / 2 + 50)
  }

  // Event emitter
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
  }

  emit(event, data) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }
  }

  destroy() {
    this.stop()

    // Cleanup systems
    if (this.currentScene) {
      this.currentScene.destroy()
    }

    if (this.network) {
      this.network.disconnect()
    }

    if (this.solanaSync) {
      this.solanaSync.destroy()
    }

    // Remove canvas
    if (this.canvas && this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas)
    }

    console.log('🗑️ Game destroyed')
  }
}

// Camera system
class Camera {
  constructor(game) {
    this.game = game
    this.x = 0
    this.y = 0
    this.zoom = 1
    this.target = null
    this.smoothing = 0.1
  }

  setPosition(x, y) {
    this.x = x
    this.y = y
  }

  setTarget(x, y) {
    this.target = { x, y }
  }

  update(deltaTime) {
    if (this.target) {
      // Smooth camera movement
      this.x += (this.target.x - this.x) * this.smoothing
      this.y += (this.target.y - this.y) * this.smoothing
    }
  }
}

// UI system placeholder
class UISystem {
  constructor(game) {
    this.game = game
    this.elements = new Map()
  }

  add(element) {
    this.elements.set(element.id, element)
  }

  remove(id) {
    this.elements.delete(id)
  }

  removeAll() {
    this.elements.clear()
  }

  get(id) {
    return this.elements.get(id)
  }

  update(id, props) {
    const element = this.elements.get(id)
    if (element) {
      Object.assign(element, props)
    }
  }

  hide(id) {
    const element = this.elements.get(id)
    if (element) element.visible = false
  }

  show(id) {
    const element = this.elements.get(id)
    if (element) element.visible = true
  }

  disable(id) {
    const element = this.elements.get(id)
    if (element) element.disabled = true
  }

  enable(id) {
    const element = this.elements.get(id)
    if (element) element.disabled = false
  }

  update(deltaTime) {
    // Update UI animations
  }

  render(ctx) {
    // Render UI elements
    this.elements.forEach(element => {
      if (element.visible !== false) {
        this.renderElement(ctx, element)
      }
    })
  }

  renderElement(ctx, element) {
    // Basic rendering - extend as needed
  }

  showNotification(notification) {
    console.log('Notification:', notification.message)
  }

  updateChat(id, message) {
    console.log('Chat:', message)
  }
}

// Input system placeholder
class InputSystem {
  constructor(game) {
    this.game = game
    this.keys = new Set()
    this.events = new Map()

    this.setupListeners()
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase())
      this.emit('keydown', e.key.toLowerCase())
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase())
      this.emit('keyup', e.key.toLowerCase())
    })
  }

  isKeyPressed(key) {
    return this.keys.has(key.toLowerCase())
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
  }

  emit(event, data) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }
  }
}

// Network system placeholder
class NetworkSystem {
  constructor(game, config) {
    this.game = game
    this.config = config
    this.socket = null
    this.events = new Map()
  }

  connect() {
    // Connect to Moddio server via WebSocket
    // This would integrate with actual Moddio networking
    console.log('Connecting to server...')
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
    }
  }

  send(event, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }))
    }
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
  }

  emit(event, data) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }

    // Also emit to wildcard listeners
    const wildcards = this.events.get('*')
    if (wildcards) {
      wildcards.forEach(cb => cb(event, data))
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FateGame
}

// Browser global
if (typeof window !== 'undefined') {
  window.FateGame = FateGame
}
