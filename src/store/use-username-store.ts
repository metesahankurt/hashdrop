import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UsernameState {
  username: string
  setUsername: (name: string) => void
  clearUsername: () => void
}

export const useUsernameStore = create<UsernameState>()(
  persist(
    (set) => ({
      username: '',
      setUsername: (name) => set({ username: name }),
      clearUsername: () => set({ username: '' }),
    }),
    { name: 'hashdrop-username' }
  )
)
