import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  ArrowRight,
  ArrowUpRight,
  MessageSquare,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfileStore } from "@/mobile/state/use-profile-store";

const ShieldCheckIcon = ShieldCheck as any;
const SendIcon = Send as any;
const UsersIcon = Users as any;
const MessageSquareIcon = MessageSquare as any;
const ArrowUpRightIcon = ArrowUpRight as any;
const ArrowRightIcon = ArrowRight as any;

const FEATURE_CARDS = [
  {
    title: "File Transfer",
    description:
      "Blazing-fast direct device-to-device transfer for files and quick text drops.",
    href: "/transfer" as const,
    icon: SendIcon,
    accent: "#3ecf8e",
    badge: "FAST LANE",
  },
  {
    title: "Conference",
    description:
      "Spin up a meeting space with a tighter mobile entry point for calls and control.",
    href: "/conference" as const,
    icon: UsersIcon,
    accent: "#a5b4fc",
    badge: "MEET",
  },
  {
    title: "Chat Room",
    description:
      "Open or join a room instantly with a calmer interface built around short sessions.",
    href: "/chatroom" as const,
    icon: MessageSquareIcon,
    accent: "#f59e0b",
    badge: "ROOMS",
  },
];

export function HomeScreen() {
  const router = useRouter();
  const { username } = useProfileStore();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.backdropOrbLarge} />
          <View style={styles.backdropOrbSmall} />

          <View style={styles.heroTopline}>
            <Text style={styles.kicker}>HASHDROP</Text>
            <View style={styles.statusPill}>
              <ShieldCheckIcon size={13} stroke="#ededed" strokeWidth={2.4} />
              <Text style={styles.statusPillText}>Protected</Text>
            </View>
          </View>

          <Text style={styles.title}>Secure end-to-end communication.</Text>
          <Text style={styles.subtitle}>No cloud. No limits.</Text>

          <View style={styles.profileCard}>
            <View>
              <Text style={styles.profileLabel}>Signed in as</Text>
              <Text style={styles.profileName}>{username}</Text>
            </View>
            <View style={styles.profileAction}>
              <ArrowUpRightIcon size={16} stroke="#0d0d0d" strokeWidth={2.4} />
            </View>
          </View>

          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Private</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Native shell</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Fast access</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose a space</Text>
          <Text style={styles.sectionMeta}>Core actions</Text>
        </View>

        {FEATURE_CARDS.map((card) => {
          const Icon = card.icon;

          return (
            <Pressable
              key={card.href}
              onPress={() => router.push(card.href)}
              style={styles.featureCard}
            >
              <View style={styles.featureTop}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: `${card.accent}18`,
                      borderColor: `${card.accent}2f`,
                    },
                  ]}
                >
                  <Icon size={20} stroke={card.accent} strokeWidth={2.2} />
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: `${card.accent}14`,
                      borderColor: `${card.accent}2b`,
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: card.accent }]}>
                    {card.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.featureTitle}>{card.title}</Text>
              <Text style={styles.featureDescription}>{card.description}</Text>

              <View style={styles.featureFooter}>
                <Text style={styles.featureCta}>Open section</Text>
                <ArrowRightIcon size={15} stroke="#3ecf8e" strokeWidth={2.3} />
              </View>
            </Pressable>
          );
        })}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 156,
    gap: 16,
  },
  hero: {
    overflow: "hidden",
    position: "relative",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#131313",
    padding: 24,
    gap: 14,
  },
  backdropOrbLarge: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(62,207,142,0.12)",
    top: -70,
    right: -55,
  },
  backdropOrbSmall: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -42,
    left: -36,
  },
  heroTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  kicker: {
    color: "#3ecf8e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPillText: {
    color: "#ededed",
    fontSize: 11,
    fontWeight: "800",
  },
  title: {
    color: "#ededed",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 38,
    maxWidth: "92%",
  },
  subtitle: {
    color: "#8b8b8b",
    fontSize: 16,
    lineHeight: 23,
    maxWidth: "85%",
  },
  profileCard: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  profileLabel: {
    color: "#8b8b8b",
    fontSize: 12,
    fontWeight: "700",
  },
  profileName: {
    color: "#ededed",
    fontSize: 22,
    fontWeight: "800",
  },
  profileAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#3ecf8e",
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipText: {
    color: "#d4d4d4",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#ededed",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionMeta: {
    color: "#8b8b8b",
    fontSize: 12,
    fontWeight: "700",
  },
  featureCard: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 12,
  },
  featureTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  featureTitle: {
    color: "#ededed",
    fontSize: 18,
    fontWeight: "700",
  },
  featureDescription: {
    color: "#8b8b8b",
    fontSize: 13,
    lineHeight: 19,
  },
  featureFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureCta: {
    color: "#3ecf8e",
    fontSize: 13,
    fontWeight: "700",
  },
  bottomSpace: {
    height: 8,
  },
});
