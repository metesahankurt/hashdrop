import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ProfileState {
  username: string;
  setUsername: (username: string) => void;
  clearUsername: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      username: "",
      setUsername: (username) => set({ username }),
      clearUsername: () => set({ username: "" }),
    }),
    {
      name: "hashdrop-mobile-profile",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
