import { create } from 'zustand'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

interface AppState {
  network: WalletAdapterNetwork
  setNetwork: (network: WalletAdapterNetwork) => void

  // UI state
  isSidebarOpen: boolean
  toggleSidebar: () => void

  // Notification state
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
}

export const useAppStore = create<AppState>((set) => ({
  network: (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet,
  setNetwork: (network) => set({ network }),

  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Math.random().toString(36).slice(2) },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))
