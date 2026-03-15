import { useState, useRef } from "react";
import {
  Pressable, ScrollView, StyleSheet, Text,
  TextInput, View, Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Check,
  MessageSquare,
  Pencil,
  Send,
  ShieldCheck,
  Users,
  Zap,
  Lock,
  X,
} from "lucide-react-native";
import { useProfileStore } from "@/mobile/state/use-profile-store";

// Lucide RN cast
const ShieldCheckIcon = ShieldCheck as any;
const SendIcon = Send as any;
const UsersIcon = Users as any;
const MessageSquareIcon = MessageSquare as any;
const ArrowRightIcon = ArrowRight as any;
const ZapIcon = Zap as any;
const LockIcon = Lock as any;
const PencilIcon = Pencil as any;
const CheckIcon = Check as any;
const XIcon = X as any;

const FEATURES = [
  {
    title: "File Transfer",
    description:
      "Direct device-to-device transfer. No cloud, no intermediaries.",
    href: "/transfer" as const,
    Icon: SendIcon,
    badge: "FAST",
  },
  {
    title: "Conference",
    description:
      "Up to 50 participants. Waiting room, screen share & chat included.",
    href: "/conference" as const,
    Icon: UsersIcon,
    badge: "MEET",
  },
  {
    title: "Chat Room",
    description:
      "Encrypted instant rooms. Open or join one with a short code.",
    href: "/chatroom" as const,
    Icon: MessageSquareIcon,
    badge: "ROOMS",
  },
];

const TRUST_CHIPS = [
  { Icon: ZapIcon, label: "Instant" },
  { Icon: LockIcon, label: "Zero-trust" },
  { Icon: ShieldCheckIcon, label: "Private" },
];

// Dock height: 48px items + 8px*2 vertical padding = 64px
const DOCK_HEIGHT = 64;
const DOCK_GAP = 16; // breathing room above dock

export function HomeScreen() {
  const router = useRouter();
  const { username, setUsername } = useProfileStore();
  const insets = useSafeAreaInsets();
  const avatarLetter = username ? username.charAt(0).toUpperCase() : "?";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const startEdit = () => {
    setDraft(username);
    setError("");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError("");
    Keyboard.dismiss();
  };

  const confirmEdit = () => {
    const val = draft.trim();
    if (val.length < 2) { setError("Min. 2 characters"); return; }
    if (val.length > 24) { setError("Max. 24 characters"); return; }
    setUsername(val);
    setEditing(false);
    setError("");
    Keyboard.dismiss();
  };

  // Dock sits at Math.max(insets.bottom, 12) from bottom
  const dockBottom = Math.max(insets.bottom, 12);
  const scrollPaddingBottom = dockBottom + DOCK_HEIGHT + DOCK_GAP;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ─────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Glow orbs */}
          <View style={styles.orbGreen} />
          <View style={styles.orbBlue} />
          <View style={styles.orbPurple} />

          {/* Top bar */}
          <View style={styles.heroTopBar}>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandText}>HASHDROP</Text>
            </View>
            <View style={styles.encryptedPill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>End-to-End</Text>
            </View>
          </View>

          {/* Title stack */}
          <View style={styles.titleBlock}>
            <Text style={styles.heroTitle}>Secure.</Text>
            <Text style={[styles.heroTitle, styles.heroTitleAccent]}>
              Private.
            </Text>
            <Text style={styles.heroTitle}>No cloud.</Text>
          </View>

          <Text style={styles.heroSubtitle}>
            Direct communication between devices — no servers, no data
            retention.
          </Text>

          {/* Trust chips */}
          <View style={styles.trustRow}>
            {TRUST_CHIPS.map(({ Icon, label }) => (
              <View key={label} style={styles.trustChip}>
                <Icon size={12} stroke="#3ecf8e" strokeWidth={2.2} />
                <Text style={styles.trustChipText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── PROFILE CARD ─────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {editing ? (draft.charAt(0).toUpperCase() || "?") : avatarLetter}
                </Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.profileLabel}>Active session</Text>
              {editing ? (
                <View>
                  <TextInput
                    ref={inputRef}
                    style={styles.profileInput}
                    value={draft}
                    onChangeText={(v) => { setDraft(v); setError(""); }}
                    onSubmitEditing={confirmEdit}
                    returnKeyType="done"
                    maxLength={24}
                    autoCorrect={false}
                    selectTextOnFocus
                  />
                  {error ? <Text style={styles.profileInputError}>{error}</Text> : null}
                </View>
              ) : (
                <Text style={styles.profileName}>{username}</Text>
              )}
            </View>
          </View>

          {editing ? (
            <View style={styles.profileEditActions}>
              <Pressable onPress={cancelEdit} style={styles.profileActionBtn}>
                <XIcon size={15} stroke="#666" strokeWidth={2.4} />
              </Pressable>
              <Pressable onPress={confirmEdit} style={[styles.profileActionBtn, styles.profileActionConfirm]}>
                <CheckIcon size={15} stroke="#08110d" strokeWidth={2.6} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={startEdit} style={styles.profileAction}>
              <PencilIcon size={15} stroke="#08110d" strokeWidth={2.4} />
            </Pressable>
          )}
        </View>

        {/* ── SECTION HEADER ───────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Spaces</Text>
          <Text style={styles.sectionMeta}>3 available</Text>
        </View>

        {/* ── FEATURE CARDS ────────────────────────────────── */}
        {FEATURES.map((card) => (
          <Pressable
            key={card.href}
            onPress={() => router.push(card.href)}
            style={({ pressed }) => [
              styles.featureCard,
              pressed && styles.featureCardPressed,
            ]}
          >
            <View style={styles.cardInner}>
              {/* Top row: icon + badge */}
              <View style={styles.cardTopRow}>
                <View style={styles.cardIconWrap}>
                  <card.Icon
                    size={22}
                    stroke="#ededed"
                    strokeWidth={1.9}
                  />
                </View>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{card.badge}</Text>
                </View>
              </View>

              {/* Title + description */}
              <View style={styles.cardTextBlock}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDesc}>{card.description}</Text>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardCtaText}>Open space</Text>
                <ArrowRightIcon size={13} stroke="#ededed" strokeWidth={2.2} />
              </View>
            </View>
          </Pressable>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },

  // ── HERO
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#101010",
    padding: 24,
    gap: 20,
    overflow: "hidden",
    minHeight: 310,
  },
  orbGreen: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(62,207,142,0.09)",
    top: -100,
    right: -80,
  },
  orbBlue: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(165,180,252,0.06)",
    bottom: -60,
    left: -50,
  },
  orbPurple: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(168,85,247,0.05)",
    top: 90,
    left: 50,
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3ecf8e",
  },
  brandText: {
    color: "#3ecf8e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  encryptedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3ecf8e",
  },
  pillText: {
    color: "#c4c4c4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  titleBlock: {
    gap: 0,
  },
  heroTitle: {
    color: "#ededed",
    fontSize: 44,
    fontWeight: "800",
    lineHeight: 50,
    letterSpacing: -1,
  },
  heroTitleAccent: {
    color: "#3ecf8e",
  },
  heroSubtitle: {
    color: "#5c5c5c",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: "88%",
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trustChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(62,207,142,0.07)",
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.14)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  trustChipText: {
    color: "#999",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── PROFILE CARD
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 24,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 14,
    gap: 12,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(62,207,142,0.10)",
    borderWidth: 1.5,
    borderColor: "rgba(62,207,142,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3ecf8e",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#08110d",
    fontSize: 18,
    fontWeight: "800",
  },
  profileLabel: {
    color: "#4a4a4a",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  profileName: {
    color: "#ededed",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 1,
  },
  profileAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3ecf8e",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── SECTION HEADER
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#ededed",
    fontSize: 17,
    fontWeight: "800",
  },
  sectionMeta: {
    color: "#444",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── FEATURE CARDS
  featureCard: {
    borderRadius: 22,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.984 }],
  },
  cardInner: {
    padding: 20,
    gap: 16,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardBadgeText: {
    color: "#666",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cardTextBlock: {
    gap: 5,
  },
  cardTitle: {
    color: "#ededed",
    fontSize: 19,
    fontWeight: "700",
  },
  cardDesc: {
    color: "#5a5a5a",
    fontSize: 13,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardCtaText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },

  // ── PROFILE EDIT
  profileInput: {
    color: "#ededed",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(62,207,142,0.4)",
    minWidth: 80,
  },
  profileInputError: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
  profileEditActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileActionConfirm: {
    backgroundColor: "#3ecf8e",
    borderColor: "#3ecf8e",
  },

});
