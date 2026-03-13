import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowUpFromLine,
  House,
  MessageSquare,
  Video,
} from "lucide-react-native";
import { useMainNavigationAnimation } from "@/mobile/navigation/MainNavigationAnimationProvider";
import type { MainRoute } from "@/mobile/navigation/use-main-navigation-store";
import { useMainNavigationStore } from "@/mobile/navigation/use-main-navigation-store";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/transfer", label: "Transfer", icon: ArrowUpFromLine },
  { href: "/conference", label: "Meet", icon: Video },
  { href: "/chatroom", label: "Chat", icon: MessageSquare },
];
const DOCK_HORIZONTAL_PADDING = 10;
const ITEM_COLLAPSED_WIDTH = 46;
const ITEM_EXPANDED_WIDTH = 108;
const ITEM_GAP = 8;
const INDICATOR_X = [10, 64, 118, 172];
const INDICATOR_WIDTH = 108;
const AnimatedText = Animated.createAnimatedComponent(Text);

export function FloatingDock() {
  const insets = useSafeAreaInsets();
  const dockBottom = Math.max(insets.bottom, 10);
  const setRoute = useMainNavigationStore((state) => state.setRoute);
  const { progress } = useMainNavigationAnimation();

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1, 2, 3],
          INDICATOR_X,
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: dockBottom, pointerEvents: "box-none" as any },
      ]}
    >
      <View style={styles.dock}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />
        {ITEMS.map((item, index) => (
          <DockItem
            key={item.href}
            href={item.href as MainRoute}
            icon={item.icon as any}
            index={index}
            label={item.label}
            onPress={() => setRoute(item.href as MainRoute)}
            progress={progress}
          />
        ))}
      </View>
    </View>
  );
}

function DockItem({
  href,
  icon: Icon,
  index,
  label,
  onPress,
  progress,
}: {
  href: MainRoute;
  icon: any;
  index: number;
  label: string;
  onPress: () => void;
  progress: SharedValue<number>;
}) {
  const activeRoute = useMainNavigationStore((state) => state.route);
  const isActive = activeRoute === href;

  const itemStyle = useAnimatedStyle(() => ({
    width: interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [ITEM_COLLAPSED_WIDTH, ITEM_EXPANDED_WIDTH, ITEM_COLLAPSED_WIDTH],
      Extrapolation.CLAMP,
    ),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [index - 1, index, index + 1],
      ["rgba(255,255,255,0.02)", "#3ecf8e", "rgba(255,255,255,0.02)"],
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [index - 0.55, index, index + 0.55],
      [0, 1, 0],
      Extrapolation.CLAMP,
    ),
    width: interpolate(
      progress.value,
      [index - 0.55, index, index + 0.55],
      [0, 42, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View style={[styles.item, itemStyle]}>
      <Pressable onPress={onPress} style={styles.pressable}>
        <Animated.View style={[styles.icon, iconStyle]}>
          <DockIcon Icon={Icon} isActive={isActive} />
        </Animated.View>
        <AnimatedText numberOfLines={1} style={[styles.label, labelStyle]}>
          {label}
        </AnimatedText>
      </Pressable>
    </Animated.View>
  );
}

function DockIcon({
  Icon,
  isActive,
}: {
  Icon: any;
  isActive: boolean;
}) {
  return (
    <Icon
      size={16}
      stroke={isActive ? "#08110d" : "#ffffff"}
      strokeWidth={2.4}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    left: 0,
    position: "absolute",
    right: 0,
    alignItems: "center",
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: DOCK_HORIZONTAL_PADDING,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(10,10,10,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 20,
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: 9,
    width: INDICATOR_WIDTH,
    height: 46,
    borderRadius: 999,
    backgroundColor: "rgba(62,207,142,0.14)",
  },
  item: {
    height: 46,
    borderRadius: 999,
  },
  pressable: {
    flex: 1,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: ITEM_GAP,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  label: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
