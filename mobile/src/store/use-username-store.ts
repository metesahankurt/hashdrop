import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UsernameStore {
  username: string;
  setUsername: (name: string) => void;
  clearUsername: () => void;
}

export const useUsernameStore = create<UsernameStore>()(
  persist(
    (set) => ({
      username: "",
      setUsername: (name) => set({ username: name }),
      clearUsername: () => set({ username: "" }),
    }),
    {
      name: "hashdrop-username",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
