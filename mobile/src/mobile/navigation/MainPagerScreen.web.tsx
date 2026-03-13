import { useEffect } from "react";

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

  useEffect(() => {
    setRoute(route);
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
