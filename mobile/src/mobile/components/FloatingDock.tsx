import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowUpFromLine,
  House,
  MessageSquare,
  Video,
} from "lucide-react-native";
import type { MainRoute } from "@/mobile/navigation/use-main-navigation-store";
import { useMainNavigationStore } from "@/mobile/navigation/use-main-navigation-store";

const ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/transfer", label: "Transfer", icon: ArrowUpFromLine },
  { href: "/conference", label: "Meet", icon: Video },
  { href: "/chatroom", label: "Chat", icon: MessageSquare },
];

export function FloatingDock() {
  const insets = useSafeAreaInsets();
  const dockBottom = Math.max(insets.bottom, 10);
  const activeRoute = useMainNavigationStore((state) => state.route);
  const setRoute = useMainNavigationStore((state) => state.setRoute);

  return (
    <View
      style={[styles.wrapper, { bottom: dockBottom, pointerEvents: "box-none" as any }]}
    >
      <View style={styles.dock}>
        {ITEMS.map((item) => {
          const active = activeRoute === item.href;
          const Icon = item.icon as any;

          return (
            <Pressable
              key={item.href}
              onPress={() => setRoute(item.href as MainRoute)}
              style={[styles.item, active ? styles.itemActive : null]}
            >
              <View style={[styles.icon, active ? styles.iconActive : null]}>
                <Icon
                  size={16}
                  stroke={active ? "#08110d" : "#a1a1a1"}
                  strokeWidth={2.4}
                />
              </View>
              {active ? (
                <Text style={[styles.label, active ? styles.labelActive : null]}>
                  {item.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
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
    paddingHorizontal: 10,
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
  item: {
    minWidth: 46,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  itemActive: {
    minWidth: 108,
    paddingRight: 14,
    backgroundColor: "rgba(62,207,142,0.14)",
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  iconActive: {
    backgroundColor: "#3ecf8e",
  },
  label: {
    color: "#8b8b8b",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  labelActive: {
    color: "#ededed",
  },
});
