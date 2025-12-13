import { useState } from 'react'

type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    // Simple console implementation for now
    // In production, this would trigger an actual toast notification
    if (variant === 'destructive') {
      console.error(`[Toast] ${title}: ${description}`)
    } else {
      console.log(`[Toast] ${title}: ${description}`)
    }

    // You can also use browser's alert as a simple fallback
    // alert(`${title}\n${description}`)
  }

  return { toast }
}
