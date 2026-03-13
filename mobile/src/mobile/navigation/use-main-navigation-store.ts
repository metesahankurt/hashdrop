import { create } from "zustand";

export type MainRoute = "/" | "/transfer" | "/conference" | "/chatroom";

interface MainNavigationState {
  route: MainRoute;
  routeRefreshNonce: number;
  setRoute: (route: MainRoute) => void;
  refreshRoute: (route: MainRoute) => void;
}

export const useMainNavigationStore = create<MainNavigationState>((set) => ({
  route: "/",
  routeRefreshNonce: 0,
  setRoute: (route) => set({ route }),
  refreshRoute: (route) =>
    set((state) => ({
      route,
      routeRefreshNonce: state.routeRefreshNonce + 1,
    })),
}));
