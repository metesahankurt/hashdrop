import { create } from "zustand";

export type MainRoute = "/" | "/transfer" | "/conference" | "/chatroom";

interface MainNavigationState {
  route: MainRoute;
  routeRefreshNonce: number;
  dockHidden: boolean;
  setRoute: (route: MainRoute) => void;
  setDockHidden: (hidden: boolean) => void;
  refreshRoute: (route: MainRoute) => void;
}

export const useMainNavigationStore = create<MainNavigationState>((set) => ({
  route: "/",
  routeRefreshNonce: 0,
  dockHidden: false,
  setRoute: (route) => set({ route }),
  setDockHidden: (dockHidden) => set({ dockHidden }),
  refreshRoute: (route) =>
    set((state) => ({
      route,
      routeRefreshNonce: state.routeRefreshNonce + 1,
    })),
}));
