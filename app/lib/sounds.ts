/**
 * Sound Effects Manager for FATE Protocol
 * Handles audio playback with preloading and fallback support
 */

export type SoundEffect = 'countdown' | 'predict' | 'win' | 'lose' | 'join' | 'click' | 'error' | 'notification'

interface AudioCache {
  [key: string]: HTMLAudioElement | null
}

class SoundManager {
  private static instance: SoundManager
  private cache: AudioCache = {}
  private enabled: boolean = true
  private volume: number = 0.5
  private soundsLoaded: boolean = false

  private soundPaths: Record<SoundEffect, string> = {
    countdown: '/sounds/countdown.mp3',
    predict: '/sounds/predict.mp3',
    win: '/sounds/win.mp3',
    lose: '/sounds/lose.mp3',
    join: '/sounds/join.mp3',
    click: '/sounds/click.mp3',
    error: '/sounds/error.mp3',
    notification: '/sounds/notification.mp3',
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  /**
   * Load sound settings from localStorage
   */
  private loadFromStorage() {
    try {
      const enabled = localStorage.getItem('fate_sounds_enabled')
      const volume = localStorage.getItem('fate_sounds_volume')

      if (enabled !== null) {
        this.enabled = enabled === 'true'
      }

      if (volume !== null) {
        this.volume = parseFloat(volume)
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error)
    }
  }

  /**
   * Save sound settings to localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem('fate_sounds_enabled', String(this.enabled))
      localStorage.setItem('fate_sounds_volume', String(this.volume))
    } catch (error) {
      console.warn('Failed to save sound settings:', error)
    }
  }

  /**
   * Preload all sound effects
   */
  async preloadSounds(): Promise<void> {
    if (typeof window === 'undefined' || this.soundsLoaded) return

    const loadPromises = Object.entries(this.soundPaths).map(([name, path]) => {
      return new Promise<void>((resolve) => {
        try {
          const audio = new Audio(path)
          audio.volume = this.volume
          audio.preload = 'auto'

          audio.addEventListener('canplaythrough', () => {
            this.cache[name] = audio
            resolve()
          }, { once: true })

          audio.addEventListener('error', () => {
            console.warn(`Failed to load sound: ${name}`)
            this.cache[name] = null
            resolve()
          }, { once: true })

          // Start loading
          audio.load()
        } catch (error) {
          console.warn(`Error preloading ${name}:`, error)
          this.cache[name] = null
          resolve()
        }
      })
    })

    await Promise.allSettled(loadPromises)
    this.soundsLoaded = true
    console.log('🔊 Sound effects loaded')
  }

  /**
   * Play a sound effect
   */
  play(sound: SoundEffect): void {
    if (!this.enabled || typeof window === 'undefined') return

    try {
      let audio = this.cache[sound]

      // Lazy load if not in cache
      if (!audio && this.soundPaths[sound]) {
        audio = new Audio(this.soundPaths[sound])
        audio.volume = this.volume
        this.cache[sound] = audio
      }

      if (audio) {
        // Clone audio for overlapping sounds
        const clone = audio.cloneNode() as HTMLAudioElement
        clone.volume = this.volume

        clone.play().catch((error) => {
          console.warn(`Failed to play sound ${sound}:`, error)
        })

        // Clean up after playing
        clone.addEventListener('ended', () => {
          clone.remove()
        })
      }
    } catch (error) {
      console.warn(`Error playing sound ${sound}:`, error)
    }
  }

  /**
   * Toggle sounds on/off
   */
  toggle(): boolean {
    this.enabled = !this.enabled
    this.saveToStorage()
    return this.enabled
  }

  /**
   * Set sound enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.saveToStorage()
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    this.saveToStorage()

    // Update volume for all cached sounds
    Object.values(this.cache).forEach((audio) => {
      if (audio) {
        audio.volume = this.volume
      }
    })
  }

  /**
   * Get current enabled state
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    Object.values(this.cache).forEach((audio) => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })
  }
}

// Export singleton instance
export const soundManager = SoundManager.getInstance()

// Convenience functions
export const playSound = (sound: SoundEffect) => soundManager.play(sound)
export const toggleSounds = () => soundManager.toggle()
export const setSoundEnabled = (enabled: boolean) => soundManager.setEnabled(enabled)
export const setSoundVolume = (volume: number) => soundManager.setVolume(volume)
export const preloadSounds = () => soundManager.preloadSounds()
export const isSoundEnabled = () => soundManager.isEnabled()
export const getSoundVolume = () => soundManager.getVolume()

// React hook for sound management
import { useState, useEffect, useCallback } from 'react'

export function useSoundManager() {
  const [enabled, setEnabledState] = useState(soundManager.isEnabled())
  const [volume, setVolumeState] = useState(soundManager.getVolume())

  useEffect(() => {
    // Preload sounds on mount
    soundManager.preloadSounds()
  }, [])

  const play = useCallback((sound: SoundEffect) => {
    soundManager.play(sound)
  }, [])

  const toggle = useCallback(() => {
    const newState = soundManager.toggle()
    setEnabledState(newState)
    return newState
  }, [])

  const setEnabled = useCallback((enabled: boolean) => {
    soundManager.setEnabled(enabled)
    setEnabledState(enabled)
  }, [])

  const setVolume = useCallback((volume: number) => {
    soundManager.setVolume(volume)
    setVolumeState(volume)
  }, [])

  return {
    enabled,
    volume,
    play,
    toggle,
    setEnabled,
    setVolume,
  }
}
