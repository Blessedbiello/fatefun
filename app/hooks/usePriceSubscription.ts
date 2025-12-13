import { useEffect, useRef } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
import { PythHttpClient, getPythProgramKeyForCluster, parsePriceData } from '@pythnetwork/client'
import { useGameStore } from '@/store/gameStore'

interface PriceSubscriptionOptions {
  marketId: number
  enabled?: boolean
  pollingInterval?: number
}

// Pyth price feed IDs for different markets
const PYTH_PRICE_FEEDS: Record<number, string> = {
  0: 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG', // SOL/USD
  1: 'GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU', // BTC/USD
  2: 'JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB', // ETH/USD
}

export function usePriceSubscription({ marketId, enabled = true, pollingInterval = 2000 }: PriceSubscriptionOptions) {
  const { connection } = useConnection()
  const updateCurrentPrice = useGameStore((s) => s.updateCurrentPrice)
  const setPriceWsConnected = useGameStore((s) => s.setPriceWsConnected)

  const subscriptionIdRef = useRef<number | null>(null)
  const pythClientRef = useRef<PythHttpClient | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPriceRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const priceFeedAddress = PYTH_PRICE_FEEDS[marketId]
    if (!priceFeedAddress) {
      console.error('Unknown market ID:', marketId)
      return
    }

    const priceFeedPubkey = new PublicKey(priceFeedAddress)

    // Initialize Pyth client
    const initPythClient = async () => {
      try {
        const pythProgramKey = getPythProgramKeyForCluster('devnet')
        pythClientRef.current = new PythHttpClient(connection, pythProgramKey)
      } catch (error) {
        console.error('Failed to initialize Pyth client:', error)
      }
    }

    initPythClient()

    // Method 1: WebSocket subscription (preferred)
    const subscribeWebSocket = async () => {
      try {
        subscriptionIdRef.current = connection.onAccountChange(
          priceFeedPubkey,
          (accountInfo) => {
            try {
              // Parse Pyth price data from account
              const priceData = parsePriceData(accountInfo.data)

              if (priceData.price && priceData.confidence) {
                const priceValue = priceData.price
                if (priceValue !== lastPriceRef.current) {
                  lastPriceRef.current = priceValue
                  updateCurrentPrice(priceValue)
                }
              }
            } catch (error) {
              console.error('Error parsing Pyth price:', error)
            }
          },
          'confirmed'
        )

        setPriceWsConnected(true)
        console.log('✅ WebSocket price subscription active')

      } catch (error) {
        console.error('WebSocket subscription failed:', error)
        setPriceWsConnected(false)

        // Fallback to polling
        startPolling()
      }
    }

    // Method 2: Polling fallback
    const startPolling = () => {
      console.log('📊 Starting price polling fallback...')

      const poll = async () => {
        try {
          // Fetch account data directly
          const accountInfo = await connection.getAccountInfo(priceFeedPubkey)
          if (!accountInfo) {
            console.error('Failed to fetch Pyth account info')
            return
          }

          // Parse price data from account
          const priceData = parsePriceData(accountInfo.data)

          if (priceData.price && priceData.confidence) {
            const priceValue = priceData.price
            if (priceValue !== lastPriceRef.current) {
              lastPriceRef.current = priceValue
              updateCurrentPrice(priceValue)
            }
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }

      // Initial poll
      poll()

      // Set up interval
      pollingIntervalRef.current = setInterval(poll, pollingInterval)
    }

    // Try WebSocket first
    subscribeWebSocket()

    // Cleanup
    return () => {
      if (subscriptionIdRef.current !== null) {
        connection.removeAccountChangeListener(subscriptionIdRef.current)
        console.log('🔌 Price WebSocket unsubscribed')
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        console.log('⏹️ Price polling stopped')
      }

      setPriceWsConnected(false)
    }
  }, [enabled, marketId, connection, updateCurrentPrice, setPriceWsConnected, pollingInterval])
}

// Alternative: HTTP-only price fetching (for static/simpler use cases)
export function usePricePolling({ marketId, enabled = true, interval = 2000 }: PriceSubscriptionOptions) {
  const updateCurrentPrice = useGameStore((s) => s.updateCurrentPrice)
  const { connection } = useConnection()

  useEffect(() => {
    if (!enabled) return

    const priceFeedAddress = PYTH_PRICE_FEEDS[marketId]
    if (!priceFeedAddress) return

    let isMounted = true
    let lastPrice = 0

    const fetchPrice = async () => {
      try {
        // Simple HTTP fetch from Pyth's API
        const response = await fetch(
          `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${priceFeedAddress}`
        )
        const data = await response.json()

        if (isMounted && data && data.length > 0) {
          const price = Number(data[0].price.price) / 1e8 // Pyth prices are scaled by 1e8
          if (price !== lastPrice) {
            lastPrice = price
            updateCurrentPrice(price)
          }
        }
      } catch (error) {
        console.error('HTTP price fetch error:', error)
      }
    }

    // Initial fetch
    fetchPrice()

    // Set up polling
    const intervalId = setInterval(fetchPrice, interval)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [enabled, marketId, interval, updateCurrentPrice])
}

// Mock price generator for testing (when Pyth is unavailable)
export function useMockPriceGenerator({ basePrice = 100, enabled = false }: { basePrice?: number; enabled?: boolean }) {
  const updateCurrentPrice = useGameStore((s) => s.updateCurrentPrice)

  useEffect(() => {
    if (!enabled) return

    let currentPrice = basePrice
    let direction = 1

    const generatePrice = () => {
      // Random walk with bounds
      const change = (Math.random() - 0.48) * 2 // Slight upward bias
      currentPrice += change

      // Bounce off bounds
      if (currentPrice > basePrice * 1.1) direction = -1
      if (currentPrice < basePrice * 0.9) direction = 1

      currentPrice += direction * 0.1

      updateCurrentPrice(Number(currentPrice.toFixed(2)))
    }

    // Initial price
    updateCurrentPrice(basePrice)

    // Update every 1 second for testing
    const interval = setInterval(generatePrice, 1000)

    return () => clearInterval(interval)
  }, [enabled, basePrice, updateCurrentPrice])
}
