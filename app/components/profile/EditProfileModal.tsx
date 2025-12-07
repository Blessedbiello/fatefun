'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Check } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentUsername?: string
  onSave: (username: string) => Promise<void>
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentUsername = '',
  onSave,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(currentUsername)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = (value: string): string | null => {
    if (!value.trim()) {
      return 'Username cannot be empty'
    }

    if (value.length < 3) {
      return 'Username must be at least 3 characters'
    }

    if (value.length > 20) {
      return 'Username must be less than 20 characters'
    }

    // Alphanumeric + underscores only
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores'
    }

    return null
  }

  const handleChange = (value: string) => {
    setUsername(value)
    const validationError = validate(value)
    setError(validationError)
  }

  const handleSave = async () => {
    const validationError = validate(username)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(username)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save username')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      setUsername(currentUsername)
      setError(null)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 max-w-md w-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="Enter username..."
                  maxLength={20}
                  disabled={isSaving}
                  className={`w-full px-4 py-3 bg-gray-800 border ${
                    error ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    error ? 'focus:ring-red-500' : 'focus:ring-purple-500'
                  } text-white placeholder-gray-500 disabled:opacity-50`}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500">
                    {username.length}/20 characters
                  </div>
                  {!error && username.length >= 3 && (
                    <div className="text-xs text-green-400 flex items-center gap-1">
                      <Check size={12} />
                      Valid
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="text-xs font-bold text-white mb-2">Requirements:</div>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className={username.length >= 3 && username.length <= 20 ? 'text-green-400' : 'text-gray-500'}>
                      {username.length >= 3 && username.length <= 20 ? '✓' : '○'}
                    </span>
                    <span>3-20 characters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={/^[a-zA-Z0-9_]*$/.test(username) ? 'text-green-400' : 'text-gray-500'}>
                      {/^[a-zA-Z0-9_]*$/.test(username) ? '✓' : '○'}
                    </span>
                    <span>Letters, numbers, and underscores only</span>
                  </li>
                </ul>
              </div>

              {/* Info */}
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="text-xs text-gray-300">
                  💡 Changing your username requires an on-chain transaction (~ 0.001 SOL)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving || !!error || !username.trim() || username === currentUsername}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium text-white hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
