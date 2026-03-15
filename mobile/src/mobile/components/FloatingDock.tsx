import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
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
  { href: "/transfer", label: "File", icon: ArrowUpFromLine },
  { href: "/conference", label: "Meet", icon: Video },
  { href: "/chatroom", label: "Chat", icon: MessageSquare },
];

const DOCK_HORIZONTAL_PADDING = 8;
const ITEM_COLLAPSED_WIDTH = 48;
const ITEM_EXPANDED_WIDTH = 112;
const ITEM_GAP = 6;
// Indicator x positions align with each item's left edge
const INDICATOR_X = [8, 62, 116, 170];
const INDICATOR_WIDTH = 112;

const AnimatedText = Animated.createAnimatedComponent(Text);

export function FloatingDock() {
  const insets = useSafeAreaInsets();
  const dockBottom = Math.max(insets.bottom, 12);
  const dockHidden = useMainNavigationStore((state) => state.dockHidden);
  const setRoute = useMainNavigationStore((state) => state.setRoute);
  const refreshRoute = useMainNavigationStore((state) => state.refreshRoute);
  const activeRoute = useMainNavigationStore((state) => state.route);
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

  if (dockHidden) return null;

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: dockBottom, pointerEvents: "box-none" as any },
      ]}
    >
      <BlurView intensity={20} tint="dark" style={styles.dock}>
        {/* Active tab highlight */}
        <Animated.View style={[styles.indicator, indicatorStyle]} />

        {ITEMS.map((item, index) => (
          <DockItem
            key={item.href}
            href={item.href as MainRoute}
            icon={item.icon as any}
            index={index}
            label={item.label}
            onPress={() => {
              const next = item.href as MainRoute;
              if (activeRoute === next) {
                refreshRoute(next);
                return;
              }
              setRoute(next);
            }}
            progress={progress}
          />
        ))}
      </BlurView>
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

  const iconBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [index - 1, index, index + 1],
      ["rgba(255,255,255,0.00)", "#3ecf8e", "rgba(255,255,255,0.00)"],
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [index - 0.5, index, index + 0.5],
      [0, 1, 0],
      Extrapolation.CLAMP,
    ),
    width: interpolate(
      progress.value,
      [index - 0.5, index, index + 0.5],
      [0, 44, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View style={[styles.item, itemStyle]}>
      <Pressable onPress={onPress} style={styles.pressable}>
        <Animated.View style={[styles.iconWrap, iconBgStyle]}>
          <Icon
            size={17}
            stroke={isActive ? "#08110d" : "rgba(255,255,255,0.65)"}
            strokeWidth={2.3}
          />
        </Animated.View>
        <AnimatedText numberOfLines={1} style={[styles.label, labelStyle]}>
          {label}
        </AnimatedText>
      </Pressable>
    </Animated.View>
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
    gap: ITEM_GAP,
    overflow: "hidden",
    paddingHorizontal: DOCK_HORIZONTAL_PADDING,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(8,8,8,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.30,
    shadowRadius: 32,
    elevation: 24,
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: 8,
    width: INDICATOR_WIDTH,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(62,207,142,0.14)",
  },
  item: {
    height: 48,
    borderRadius: 999,
  },
  pressable: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: ITEM_GAP,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
});
