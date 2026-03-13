import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Upload, Video, MessageSquare, Shield, Zap, Lock } from "lucide-react-native";

const { width } = Dimensions.get("window");

const features = [
  {
    icon: Upload,
    color: "#3ecf8e",
    bg: "rgba(62,207,142,0.12)",
    title: "File Transfer",
    description: "Send files P2P with no cloud storage. Encrypted, instant, private.",
    route: "/transfer",
    tag: "No limit",
  },
  {
    icon: Video,
    color: "#818cf8",
    bg: "rgba(129,140,248,0.12)",
    title: "Conference",
    description: "Video calls for up to 50 participants with screen sharing and chat.",
    route: "/conference",
    tag: "50 people",
  },
  {
    icon: MessageSquare,
    color: "#fb923c",
    bg: "rgba(249,115,22,0.12)",
    title: "Chat Room",
    description: "P2P encrypted group chat. No account, no server logs.",
    route: "/chatroom",
    tag: "Encrypted",
  },
];

const highlights = [
  { icon: Shield, text: "End-to-end encrypted" },
  { icon: Zap, text: "Zero latency P2P" },
  { icon: Lock, text: "No cloud, no tracking" },
];

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>#</Text>
        </View>
        <Text style={styles.heroTitle}>HashDrop</Text>
        <Text style={styles.heroSubtitle}>
          Private P2P communication.{"\n"}No accounts, no data collection.
        </Text>
      </View>

      {/* Highlights */}
      <View style={styles.highlights}>
        {highlights.map(({ icon: Icon, text }) => (
          <View key={text} style={styles.highlight}>
            <Icon size={14} color="#3ecf8e" />
            <Text style={styles.highlightText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Feature Cards */}
      <Text style={styles.sectionTitle}>What would you like to do?</Text>
      <View style={styles.cards}>
        {features.map(({ icon: Icon, color, bg, title, description, route, tag }) => (
          <TouchableOpacity
            key={route}
            style={styles.card}
            onPress={() => router.push(route as any)}
            activeOpacity={0.75}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconBg, { backgroundColor: bg }]}>
                <Icon size={26} color={color} />
              </View>
              <View style={[styles.tagBg, { borderColor: color + "33", backgroundColor: color + "11" }]}>
                <Text style={[styles.tagText, { color }]}>{tag}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc}>{description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        HashDrop v1.1.0 · Open Source · Privacy First
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  hero: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(62,207,142,0.1)",
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#3ecf8e",
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#ededed",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#8b8b8b",
    textAlign: "center",
    lineHeight: 22,
  },
  highlights: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  highlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(62,207,142,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.15)",
  },
  highlightText: { fontSize: 12, color: "#3ecf8e", fontWeight: "500" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ededed",
  },
  cards: { gap: 12 },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tagBg: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 11, fontWeight: "600" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#ededed" },
  cardDesc: { fontSize: 13, color: "#8b8b8b", lineHeight: 19 },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(139,139,139,0.5)",
    marginTop: 8,
  },
});
