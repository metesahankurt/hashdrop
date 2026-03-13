import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

interface MainNavigationAnimationContextValue {
  progress: SharedValue<number>;
}

const MainNavigationAnimationContext =
  createContext<MainNavigationAnimationContextValue | null>(null);

export function MainNavigationAnimationProvider({
  children,
}: PropsWithChildren) {
  const progress = useSharedValue(0);

  return (
    <MainNavigationAnimationContext.Provider value={{ progress }}>
      {children}
    </MainNavigationAnimationContext.Provider>
  );
}

export function useMainNavigationAnimation() {
  const context = useContext(MainNavigationAnimationContext);

  if (!context) {
    throw new Error(
      "useMainNavigationAnimation must be used within MainNavigationAnimationProvider",
    );
  }

  return context;
}
