import { useEffect } from "react";

import { useMainNavigationAnimation } from "@/mobile/navigation/MainNavigationAnimationProvider";
import type { MainRoute } from "@/mobile/navigation/use-main-navigation-store";
import { useMainNavigationStore } from "@/mobile/navigation/use-main-navigation-store";
import { ChatRoomScreen } from "@/mobile/screens/ChatRoomScreen";
import { ConferenceScreen } from "@/mobile/screens/ConferenceScreen";
import { HomeScreen } from "@/mobile/screens/HomeScreen";
import { TransferScreen } from "@/mobile/screens/TransferScreen";

interface MainPagerScreenProps {
  route: MainRoute;
}

export function MainPagerScreen({ route }: MainPagerScreenProps) {
  const setRoute = useMainNavigationStore((state) => state.setRoute);
  const { progress } = useMainNavigationAnimation();

  useEffect(() => {
    setRoute(route);
    progress.value =
      route === "/transfer"
        ? 1
        : route === "/conference"
          ? 2
          : route === "/chatroom"
            ? 3
            : 0;
  }, [route, setRoute]);

  if (route === "/transfer") {
    return <TransferScreen />;
  }

  if (route === "/conference") {
    return <ConferenceScreen />;
  }

  if (route === "/chatroom") {
    return <ChatRoomScreen />;
  }

  return <HomeScreen />;
}
