/**
 * FATE Protocol - Price Oracle
 * Fetches real-time price data from Pyth Network
 */

export interface PriceUpdate {
  price: number
  confidence: number
  timestamp: number
  symbol: string
}

export class PriceOracle {
  private feedAddress: string
  private currentPrice: PriceUpdate | null = null
  private subscribers: ((update: PriceUpdate) => void)[] = []
  private updateInterval: NodeJS.Timeout | null = null

  constructor(feedAddress: string) {
    this.feedAddress = feedAddress
  }

  async start() {
    // Initial fetch
    await this.fetchPrice()

    // Subscribe to updates every 1 second
    this.updateInterval = setInterval(() => {
      this.fetchPrice()
    }, 1000)
  }

  private async fetchPrice() {
    try {
      // In production, this would fetch from Pyth via WebSocket
      // For now, simulate price updates
      const mockPrice: PriceUpdate = {
        price: 100 + Math.random() * 10 - 5, // Random walk
        confidence: 0.1,
        timestamp: Date.now(),
        symbol: 'SOL/USD',
      }

      this.currentPrice = mockPrice
      this.notifySubscribers(mockPrice)
    } catch (error) {
      console.error('Failed to fetch price:', error)
    }
  }

  subscribe(callback: (update: PriceUpdate) => void) {
    this.subscribers.push(callback)

    // Send current price immediately
    if (this.currentPrice) {
      callback(this.currentPrice)
    }

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback)
    }
  }

  private notifySubscribers(update: PriceUpdate) {
    this.subscribers.forEach((callback) => callback(update))
  }

  getCurrentPrice(): PriceUpdate | null {
    return this.currentPrice
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    this.subscribers = []
  }
}
