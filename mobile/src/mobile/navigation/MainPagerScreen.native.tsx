import PagerView from "react-native-pager-view";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

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

const ROUTES: MainRoute[] = ["/", "/transfer", "/conference", "/chatroom"];
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export function MainPagerScreen({ route }: MainPagerScreenProps) {
  const pagerRef = useRef<PagerView>(null);
  const activeRoute = useMainNavigationStore((state) => state.route);
  const setRoute = useMainNavigationStore((state) => state.setRoute);
  const { progress } = useMainNavigationAnimation();

  const initialPage = useMemo(() => {
    const index = ROUTES.indexOf(route);
    return index === -1 ? 0 : index;
  }, [route]);

  useEffect(() => {
    setRoute(route);
    progress.value = initialPage;
  }, [route, setRoute]);

  useEffect(() => {
    const nextPage = ROUTES.indexOf(activeRoute);
    if (nextPage !== -1) {
      pagerRef.current?.setPage(nextPage);
    }
  }, [activeRoute]);

  return (
    <AnimatedPagerView
      ref={pagerRef}
      initialPage={initialPage}
      onPageScroll={(event) => {
        progress.value =
          event.nativeEvent.position + event.nativeEvent.offset;
      }}
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
    </AnimatedPagerView>
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
