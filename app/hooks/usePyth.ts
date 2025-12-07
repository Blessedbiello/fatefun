import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client'
import { useEffect, useState } from 'react'

export interface PriceData {
  price: number
  confidence: number
  exponent: number
  publishTime: number
}

export function usePythPrice(feedAddress: string) {
  const { connection } = useConnection()
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!feedAddress) return

    const fetchPrice = async () => {
      try {
        setLoading(true)
        const pythPublicKey = getPythProgramKeyForCluster('devnet')
        const pythClient = new PythHttpClient(connection, pythPublicKey)

        const data = await pythClient.getData()
        const productPrice = data.productPrice.get(feedAddress)

        if (productPrice?.price) {
          setPriceData({
            price: productPrice.price,
            confidence: productPrice.confidence || 0,
            exponent: productPrice.exponent || 0,
            publishTime: productPrice.publishTime || 0,
          })
        }
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [connection, feedAddress])

  return { priceData, loading, error }
}

export function formatPythPrice(price: number, exponent: number): string {
  const scaledPrice = price * Math.pow(10, exponent)
  return scaledPrice.toFixed(2)
}
