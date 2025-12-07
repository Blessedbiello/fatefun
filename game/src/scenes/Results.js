/**
 * Results Scene
 * Post-match results display
 */

class Results {
  constructor(game) {
    this.game = game
    this.name = 'Results'

    this.matchId = null
    this.results = null
    this.localPlayerResult = null
  }

  init(data) {
    this.matchId = data.matchId

    // Fetch results from server
    this.game.network.send('get-match-results', { matchId: this.matchId })

    // Setup UI
    this.setupUI()

    // Listen for results
    this.game.on('match-results', (results) => {
      this.results = results
      this.processResults()
    })
  }

  setupUI() {
    // Continue button
    this.game.ui.add({
      id: 'continue-button',
      type: 'button',
      x: 760,
      y: 900,
      width: 400,
      height: 60,
      label: 'Continue',
      onClick: () => this.returnToMenu(),
    })
  }

  processResults() {
    const winningSide = this.results.winningSide // 'higher' or 'lower'
    const winningPlayers = this.results.winners
    const losingPlayers = this.results.losers

    // Find local player result
    const localPlayer = [...winningPlayers, ...losingPlayers]
      .find(p => p.id === this.game.localPlayerId)

    if (localPlayer) {
      this.localPlayerResult = {
        won: winningPlayers.includes(localPlayer),
        prediction: localPlayer.prediction,
        winnings: localPlayer.winnings || 0,
      }
    }

    this.render()
  }

  returnToMenu() {
    this.game.changeScene('menu')
  }

  update(deltaTime) {
    // Animate results
  }

  render(ctx) {
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 1920, 1080)

    if (!this.results) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('Loading results...', 960, 540)
      return
    }

    // Draw results
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 72px Inter'
    ctx.textAlign = 'center'

    if (this.localPlayerResult?.won) {
      ctx.fillStyle = '#10b981'
      ctx.fillText('YOU WON!', 960, 200)
      ctx.font = 'bold 48px Inter'
      ctx.fillText(`+${this.localPlayerResult.winnings.toFixed(2)} SOL`, 960, 300)
    } else {
      ctx.fillStyle = '#ef4444'
      ctx.fillText('YOU LOST', 960, 200)
    }

    // Draw match summary
    ctx.font = '24px Inter'
    ctx.fillStyle = '#9ca3af'
    ctx.fillText(`Winning Side: ${this.results.winningSide.toUpperCase()}`, 960, 400)
    ctx.fillText(`Final Price: $${this.results.finalPrice.toFixed(2)}`, 960, 450)

    // Draw leaderboard
    const winners = this.results.winners.slice(0, 10)
    let y = 550

    ctx.font = 'bold 20px Inter'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Top Winners', 960, y)
    y += 40

    ctx.font = '16px Inter'
    winners.forEach((player, i) => {
      ctx.textAlign = 'left'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`${i + 1}. ${player.username}`, 660, y)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#10b981'
      ctx.fillText(`+${player.winnings.toFixed(2)} SOL`, 1260, y)
      y += 30
    })
  }

  destroy() {
    this.game.ui.removeAll()
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Results
}
