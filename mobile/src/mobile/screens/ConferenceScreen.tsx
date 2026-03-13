import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  ArrowRight,
  Link2,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react-native";

import { generateSecureCode, isValidCode } from "@/mobile/lib/code-generator";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextField } from "../components/TextField";

const VideoIcon = Video as any;
const UsersIcon = Users as any;
const LinkIcon = Link2 as any;
const ArrowRightIcon = ArrowRight as any;
const ShieldCheckIcon = ShieldCheck as any;

export function ConferenceScreen() {
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const normalizedJoinCode = joinCode.toUpperCase();

  return (
    <AppShell
      title="Conference"
      subtitle="Host or join a meeting from a tighter native entry point built for quick room access and clearer control."
    >
      <View style={styles.heroCard}>
        <View style={styles.heroOrb} />
        <Text style={styles.heroKicker}>MEETING SPACE</Text>
        <Text style={styles.heroTitle}>Open a room in seconds.</Text>
        <Text style={styles.heroText}>
          Create a code for your meeting or join an existing room with a direct native flow.
        </Text>

        <View style={styles.heroInline}>
          <View style={styles.heroPill}>
            <ShieldCheckIcon size={14} stroke="#ededed" strokeWidth={2.3} />
            <Text style={styles.heroPillText}>Controlled access</Text>
          </View>
          <View style={styles.heroPill}>
            <UsersIcon size={14} stroke="#ededed" strokeWidth={2.3} />
            <Text style={styles.heroPillText}>Room-based entry</Text>
          </View>
        </View>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureTop}>
          <View style={[styles.iconWrap, styles.iconWrapBlue]}>
            <VideoIcon size={20} stroke="#a5b4fc" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgeBlue]}>
            <Text style={[styles.badgeText, styles.badgeTextBlue]}>HOST</Text>
          </View>
        </View>

        <Text style={styles.featureTitle}>Create a meeting code</Text>
        <Text style={styles.featureDescription}>
          Generate a one-time code, share it with participants, and start the room from mobile.
        </Text>

        <PrimaryButton onPress={() => setRoomCode(generateSecureCode())}>
          Generate meeting code
        </PrimaryButton>

        {roomCode ? (
          <View style={styles.roomBox}>
            <View>
              <Text style={styles.roomLabel}>Active meeting code</Text>
              <Text style={styles.roomValue}>{roomCode}</Text>
            </View>
            <View style={styles.roomIcon}>
              <LinkIcon size={16} stroke="#0d0d0d" strokeWidth={2.2} />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureTop}>
          <View style={[styles.iconWrap, styles.iconWrapPurple]}>
            <UsersIcon size={20} stroke="#c4b5fd" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgePurple]}>
            <Text style={[styles.badgeText, styles.badgeTextPurple]}>JOIN</Text>
          </View>
        </View>

        <Text style={styles.featureTitle}>Join with a room code</Text>
        <Text style={styles.featureDescription}>
          Enter the meeting code from the host and prepare the room connection flow.
        </Text>

        <TextField
          autoCapitalize="characters"
          label="Meeting code"
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
      </View>

      <View style={styles.miniPanel}>
        <Text style={styles.miniPanelTitle}>Next connection layer</Text>
        <Text style={styles.miniPanelText}>
          Live media, participant tiles, and host controls will plug into this screen next.
        </Text>
        <View style={styles.miniPanelFooter}>
          <Text style={styles.miniPanelLink}>Continue setup</Text>
          <ArrowRightIcon size={15} stroke="#a5b4fc" strokeWidth={2.2} />
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
    backgroundColor: "rgba(129,140,248,0.14)",
    right: -40,
    top: -62,
  },
  heroKicker: {
    color: "#a5b4fc",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: "#ededed",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
    maxWidth: "90%",
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
  iconWrapBlue: {
    backgroundColor: "rgba(129,140,248,0.12)",
    borderColor: "rgba(129,140,248,0.24)",
  },
  iconWrapPurple: {
    backgroundColor: "rgba(196,181,253,0.12)",
    borderColor: "rgba(196,181,253,0.24)",
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeBlue: {
    backgroundColor: "rgba(129,140,248,0.12)",
    borderColor: "rgba(129,140,248,0.2)",
  },
  badgePurple: {
    backgroundColor: "rgba(196,181,253,0.12)",
    borderColor: "rgba(196,181,253,0.2)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  badgeTextBlue: {
    color: "#a5b4fc",
  },
  badgeTextPurple: {
    color: "#c4b5fd",
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
    borderColor: "rgba(129,140,248,0.18)",
    backgroundColor: "rgba(129,140,248,0.08)",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  roomLabel: {
    color: "#a5b4fc",
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
  roomIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#a5b4fc",
    alignItems: "center",
    justifyContent: "center",
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
    color: "#a5b4fc",
    fontSize: 13,
    fontWeight: "700",
  },
});
