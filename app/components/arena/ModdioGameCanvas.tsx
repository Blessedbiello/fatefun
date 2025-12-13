'use client'

import { useEffect, useRef, useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'

interface ModdioGameCanvasProps {
  matchId: string
  marketName: string
  startingPrice: number
  predictionDeadline: number
  onGameEnd?: (result: any) => void
}

export function ModdioGameCanvas({
  matchId,
  marketName,
  startingPrice,
  predictionDeadline,
  onGameEnd,
}: ModdioGameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<any>(null)
  const { wallet, publicKey } = useWallet()
  const { connection } = useConnection()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [gameStatus, setGameStatus] = useState<'connecting' | 'loaded' | 'playing' | 'ended'>('connecting')

  useEffect(() => {
    if (!canvasRef.current || !wallet || !publicKey) return

    let game: any = null

    const initializeGame = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // TODO: Moddio game engine integration
        // Dynamically import the Moddio game engine
        // In production, this would be the built Moddio bundle
        // const { default: FateGame } = await import('@/game/src/Game')

        // Temporary: Skip game initialization until Moddio integration is complete
        console.warn('Moddio game engine not yet integrated - using placeholder')
        setGameStatus('loaded')
        setIsLoading(false)
        return

        // Create anchor provider
        const provider = new AnchorProvider(
          connection,
          wallet.adapter as any,
          { commitment: 'confirmed' }
        )
        setProvider(provider)

        // Load program
        const programId = new PublicKey(process.env.NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID!)
        const idl = await Program.fetchIdl(programId, provider)
        const program = new Program(idl!, provider)

        // Initialize game instance
        game = new FateGame(canvasRef.current)
        await game.initialize(wallet.adapter, connection, program)

        // Setup game event listeners
        game.on('game-loaded', () => {
          setIsLoading(false)
          setGameStatus('loaded')
        })

        game.on('game-started', () => {
          setGameStatus('playing')
        })

        game.on('game-ended', (result: any) => {
          setGameStatus('ended')
          onGameEnd?.(result)
        })

        game.on('error', (err: Error) => {
          setError(err.message)
          setIsLoading(false)
        })

        // Start the arena scene
        game.changeScene('arena', {
          matchId,
          marketName,
          startingPrice,
          predictionDeadline,
          resolutionTime: predictionDeadline + 60, // +1 minute for resolution
        })

        game.start()

        gameInstanceRef.current = game

      } catch (err) {
        console.error('Failed to initialize game:', err)
        setError(err instanceof Error ? err.message : 'Failed to load game')
        setIsLoading(false)
      }
    }

    initializeGame()

    // Cleanup
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy()
        gameInstanceRef.current = null
      }
    }
  }, [canvasRef, wallet, publicKey, connection, matchId, marketName, startingPrice, predictionDeadline, onGameEnd])

  const toggleMute = () => {
    if (gameInstanceRef.current?.sounds) {
      gameInstanceRef.current.sounds.setEnabled(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!canvasRef.current) return

    if (!document.fullscreenElement) {
      canvasRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error('Fullscreen failed:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }

  if (!wallet || !publicKey) {
    return (
      <div className="w-full aspect-video bg-gray-900 border-2 border-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <h3 className="text-xl font-bold text-white mb-2">Wallet Not Connected</h3>
          <p className="text-gray-400">Please connect your wallet to play</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Game Canvas Container */}
      <div
        ref={canvasRef}
        className="w-full aspect-video bg-gray-900 border-2 border-purple-500 rounded-lg overflow-hidden relative"
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center rounded-lg z-10"
          >
            <div className="text-center">
              <Loader2 size={48} className="text-purple-500 animate-spin mx-auto mb-4" />
              <div className="text-xl font-bold text-white mb-2">
                {gameStatus === 'connecting' ? 'Connecting to game...' : 'Loading arena...'}
              </div>
              <div className="text-gray-400">Please wait</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-900/95 backdrop-blur-sm flex items-center justify-center rounded-lg z-10"
          >
            <div className="text-center px-6">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-2">Game Error</h3>
              <p className="text-red-200 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white text-red-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Controls Overlay */}
      {!isLoading && !error && (
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          {/* Mute Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="p-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX size={20} className="text-gray-400" />
            ) : (
              <Volume2 size={20} className="text-white" />
            )}
          </motion.button>

          {/* Fullscreen Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="p-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize size={20} className="text-white" />
            ) : (
              <Maximize size={20} className="text-white" />
            )}
          </motion.button>
        </div>
      )}

      {/* Game Status Indicator */}
      {!isLoading && !error && (
        <div className="absolute bottom-4 left-4 z-20">
          <div className="px-4 py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                gameStatus === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-white font-medium">
                {gameStatus === 'loaded' && 'Ready'}
                {gameStatus === 'playing' && 'Live'}
                {gameStatus === 'ended' && 'Match Ended'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controls Guide */}
      {!isLoading && !error && gameStatus === 'playing' && (
        <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="text-sm text-gray-300 space-y-2">
            <div className="font-bold text-white mb-2">🎮 Controls</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div><span className="text-purple-400">WASD/Arrows:</span> Move</div>
              <div><span className="text-purple-400">1-8:</span> Emotes</div>
              <div><span className="text-purple-400">Click Buttons:</span> Predict</div>
              <div><span className="text-purple-400">Enter:</span> Chat</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
