import { create } from 'zustand'

export type AppMode = 'welcome' | 'transfer' | 'videocall' | 'chatroom'

interface AppState {
  appMode: AppMode
  setAppMode: (mode: AppMode) => void
}

export const useAppStore = create<AppState>((set) => ({
  appMode: 'welcome',
  setAppMode: (mode) => set({ appMode: mode }),
}))
