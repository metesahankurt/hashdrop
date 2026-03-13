import { create } from "zustand";

export type MainRoute = "/" | "/transfer" | "/conference" | "/chatroom";

interface MainNavigationState {
  route: MainRoute;
  setRoute: (route: MainRoute) => void;
}

export const useMainNavigationStore = create<MainNavigationState>((set) => ({
  route: "/",
  setRoute: (route) => set({ route }),
}));
