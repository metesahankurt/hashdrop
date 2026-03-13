import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  ArrowRight,
  Eye,
  Lock,
  MessageSquare,
  Plus,
  ScanLine,
} from "lucide-react-native";

import { generateSecureCode, isValidCode } from "@/mobile/lib/code-generator";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextField } from "../components/TextField";

const MessageSquareIcon = MessageSquare as any;
const PlusIcon = Plus as any;
const LockIcon = Lock as any;
const EyeIcon = Eye as any;
const ScanIcon = ScanLine as any;
const ArrowRightIcon = ArrowRight as any;

export function ChatRoomScreen() {
  const [createdCode, setCreatedCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [password, setPassword] = useState("");

  const normalizedJoinCode = joinCode.toUpperCase();

  return (
    <AppShell
      title="Chat Room"
      subtitle="Private room-based messaging with a tighter native setup for creating, protecting, and joining a chat space."
    >
      <View style={styles.heroCard}>
        <View style={styles.heroOrb} />
        <Text style={styles.heroKicker}>ROOM MESSAGING</Text>
        <Text style={styles.heroTitle}>Start a private room in seconds.</Text>
        <Text style={styles.heroText}>
          Create a shareable room code, optionally add a password, or join an existing room with a direct mobile flow.
        </Text>

        <View style={styles.heroInline}>
          <View style={styles.heroPill}>
            <LockIcon size={14} stroke="#ededed" strokeWidth={2.3} />
            <Text style={styles.heroPillText}>Optional password</Text>
          </View>
          <View style={styles.heroPill}>
            <MessageSquareIcon size={14} stroke="#ededed" strokeWidth={2.3} />
            <Text style={styles.heroPillText}>Room-based entry</Text>
          </View>
        </View>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureTop}>
          <View style={[styles.iconWrap, styles.iconWrapAmber]}>
            <PlusIcon size={20} stroke="#f59e0b" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgeAmber]}>
            <Text style={[styles.badgeText, styles.badgeTextAmber]}>CREATE</Text>
          </View>
        </View>

        <Text style={styles.featureTitle}>Create a room code</Text>
        <Text style={styles.featureDescription}>
          Generate a room, share the code, and decide whether the room should stay open or password protected.
        </Text>

        <TextField
          label="Room password"
          onChangeText={setPassword}
          placeholder="Optional password"
          value={password}
        />

        <PrimaryButton onPress={() => setCreatedCode(generateSecureCode())}>
          Generate room code
        </PrimaryButton>

        {createdCode ? (
          <View style={styles.roomBox}>
            <View>
              <Text style={styles.roomLabel}>Active room code</Text>
              <Text style={styles.roomValue}>{createdCode}</Text>
            </View>
            <View style={styles.roomMeta}>
              <EyeIcon size={15} stroke="#0d0d0d" strokeWidth={2.2} />
              <Text style={styles.roomMetaText}>
                {password.trim() ? "Locked" : "Open"}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureTop}>
          <View style={[styles.iconWrap, styles.iconWrapGold]}>
            <MessageSquareIcon size={20} stroke="#fbbf24" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgeGold]}>
            <Text style={[styles.badgeText, styles.badgeTextGold]}>JOIN</Text>
          </View>
        </View>

        <Text style={styles.featureTitle}>Join an existing room</Text>
        <Text style={styles.featureDescription}>
          Enter a room code and prepare the connection flow for the active chat session.
        </Text>

        <TextField
          autoCapitalize="characters"
          label="Room code"
          onChangeText={(value) => setJoinCode(value.toUpperCase())}
          placeholder="COSMIC-FALCON"
          value={normalizedJoinCode}
        />

        <PrimaryButton
          disabled={!isValidCode(normalizedJoinCode)}
          onPress={() => {}}
          tone="secondary"
        >
          Prepare room join
        </PrimaryButton>

        <View style={styles.inlineAction}>
          <ScanIcon size={15} stroke="#fbbf24" strokeWidth={2.2} />
          <Text style={styles.inlineActionText}>QR join can plug in here next</Text>
        </View>
      </View>

      <View style={styles.miniPanel}>
        <Text style={styles.miniPanelTitle}>Next connection layer</Text>
        <Text style={styles.miniPanelText}>
          Native peer connectivity, participant presence, and live message threads will plug into this route next.
        </Text>
        <View style={styles.miniPanelFooter}>
          <Text style={styles.miniPanelLink}>Continue setup</Text>
          <ArrowRightIcon size={15} stroke="#f59e0b" strokeWidth={2.2} />
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    overflow: "hidden",
    position: "relative",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#131313",
    padding: 20,
    gap: 10,
  },
  heroOrb: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(245,158,11,0.12)",
    right: -40,
    top: -62,
  },
  heroKicker: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: "#ededed",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
    maxWidth: "92%",
  },
  heroText: {
    color: "#8b8b8b",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: "92%",
  },
  heroInline: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  heroPillText: {
    color: "#d4d4d4",
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
  iconWrapAmber: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.24)",
  },
  iconWrapGold: {
    backgroundColor: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.24)",
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeAmber: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.2)",
  },
  badgeGold: {
    backgroundColor: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.2)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  badgeTextAmber: {
    color: "#f59e0b",
  },
  badgeTextGold: {
    color: "#fbbf24",
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
  roomBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
    backgroundColor: "rgba(245,158,11,0.08)",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  roomLabel: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  roomValue: {
    color: "#ededed",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  roomMeta: {
    minWidth: 72,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
  },
  roomMetaText: {
    color: "#0d0d0d",
    fontSize: 12,
    fontWeight: "800",
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  inlineActionText: {
    color: "#d4d4d4",
    fontSize: 13,
    fontWeight: "600",
  },
  miniPanel: {
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 8,
  },
  miniPanelTitle: {
    color: "#ededed",
    fontSize: 16,
    fontWeight: "700",
  },
  miniPanelText: {
    color: "#8b8b8b",
    fontSize: 13,
    lineHeight: 19,
  },
  miniPanelFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  miniPanelLink: {
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "700",
  },
});
