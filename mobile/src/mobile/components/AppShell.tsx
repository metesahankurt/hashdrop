import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface AppShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

const DOCK_HEIGHT = 64;
const DOCK_GAP = 16;

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = Math.max(insets.bottom, 12) + DOCK_HEIGHT + DOCK_GAP;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: scrollPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>HASHDROP</Text>
          </View>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0d0d0d" },
  scroll: { flex: 1, backgroundColor: "#0d0d0d" },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#101010",
    padding: 24,
    gap: 14,
    overflow: "hidden",
    minHeight: 180,
  },
  heroOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(62,207,142,0.07)",
    top: -70,
    right: -60,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3ecf8e",
  },
  brandText: {
    color: "#3ecf8e",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  heroTitle: {
    color: "#ededed",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.7,
    lineHeight: 40,
  },
  heroSubtitle: {
    color: "#5c5c5c",
    fontSize: 14,
    lineHeight: 21,
  },
});
