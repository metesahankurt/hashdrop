import PagerView from "react-native-pager-view";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import type { MainRoute } from "@/mobile/navigation/use-main-navigation-store";
import { useMainNavigationStore } from "@/mobile/navigation/use-main-navigation-store";
import { ChatRoomScreen } from "@/mobile/screens/ChatRoomScreen";
import { ConferenceScreen } from "@/mobile/screens/ConferenceScreen";
import { HomeScreen } from "@/mobile/screens/HomeScreen";
import { TransferScreen } from "@/mobile/screens/TransferScreen";

interface MainPagerScreenProps {
  route: MainRoute;
}

const ROUTES: MainRoute[] = ["/", "/transfer", "/conference", "/chatroom"];

export function MainPagerScreen({ route }: MainPagerScreenProps) {
  const pagerRef = useRef<PagerView>(null);
  const activeRoute = useMainNavigationStore((state) => state.route);
  const setRoute = useMainNavigationStore((state) => state.setRoute);

  const initialPage = useMemo(() => {
    const index = ROUTES.indexOf(route);
    return index === -1 ? 0 : index;
  }, [route]);

  useEffect(() => {
    setRoute(route);
  }, [route, setRoute]);

  useEffect(() => {
    const nextPage = ROUTES.indexOf(activeRoute);
    if (nextPage !== -1) {
      pagerRef.current?.setPage(nextPage);
    }
  }, [activeRoute]);

  return (
    <PagerView
      ref={pagerRef}
      initialPage={initialPage}
      onPageSelected={(event) => {
        const nextRoute = ROUTES[event.nativeEvent.position] ?? "/";
        setRoute(nextRoute);
      }}
      overdrag={false}
      style={styles.pager}
    >
      <View key="home" style={styles.page}>
        <HomeScreen />
      </View>
      <View key="transfer" style={styles.page}>
        <TransferScreen />
      </View>
      <View key="conference" style={styles.page}>
        <ConferenceScreen />
      </View>
      <View key="chatroom" style={styles.page}>
        <ChatRoomScreen />
      </View>
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
