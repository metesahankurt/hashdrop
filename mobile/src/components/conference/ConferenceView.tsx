import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import {
  Plus,
  LogIn,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  Video,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useConferenceStore } from "@/store/use-conference-store";
import { useProfileStore } from "@/mobile/state/use-profile-store";
import { useMainNavigationStore } from "@/mobile/navigation/use-main-navigation-store";
import { generateSecureCode } from "@/lib/code-generator";
import { ConferenceRoom } from "./ConferenceRoom";

const PlusIcon = Plus as any;
const LogInIcon = LogIn as any;
const CopyIcon = Copy as any;
const CheckIcon = Check as any;
const ArrowLeftIcon = ArrowLeft as any;
const RefreshCwIcon = RefreshCw as any;
const VideoIcon = Video as any;

const LIVEKIT_URL =
  process.env.EXPO_PUBLIC_LIVEKIT_URL || "wss://your-project.livekit.cloud";
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "https://your-hashdrop-domain.com";
const EXPO_GO_CONFERENCE_ERROR =
  "Conference requires a development build.\n\nRun:\n  npx expo run:ios\n  npx expo run:android";

const DOCK_HEIGHT = 64;
const DOCK_GAP = 24;

type ConferenceMode = "hub" | "create" | "join";

interface ExpoGoBridgeHandlers {
  onCreate: (code: string, options?: { autoEnter?: boolean }) => void;
  onJoin: (code: string, options?: { autoEnter?: boolean }) => void;
}
interface ConferenceViewProps {
  expoGoBridgeHandlers?: ExpoGoBridgeHandlers;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hub
// ─────────────────────────────────────────────────────────────────────────────
function ConferenceHub({ onSelect }: { onSelect: (m: ConferenceMode) => void }) {
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = Math.max(insets.bottom, 12) + DOCK_HEIGHT + DOCK_GAP;

  return (
    <SafeAreaView edges={["top"]} style={S.safeArea}>
      <ScrollView
        style={S.scroll}
        contentContainerStyle={[S.hubContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={S.hero}>
          <View style={S.heroOrb} />
          <View style={S.heroTopBar}>
            <View style={S.brandRow}>
              <View style={S.brandDot} />
              <Text style={S.brandText}>CONFERENCE</Text>
            </View>
            <View style={S.heroPill}>
              <Text style={S.heroPillText}>MEET</Text>
            </View>
          </View>
          <Text style={S.heroTitle}>Meet up to{"\n"}50 people.</Text>
          <Text style={S.heroSubtitle}>
            End-to-end encrypted. No sign-up required.
          </Text>
        </View>

        {/* Section header */}
        <View style={S.sectionHeader}>
          <Text style={S.sectionTitle}>Choose mode</Text>
          <Text style={S.sectionMeta}>2 options</Text>
        </View>

        {/* New Meeting card */}
        <Pressable
          style={({ pressed }) => [S.modeCard, pressed && S.modeCardPressed]}
          onPress={() => onSelect("create")}
        >
          <View style={S.modeCardInner}>
            <View style={S.modeCardTop}>
              <View style={S.modeIconWrap}>
                <PlusIcon size={22} stroke="#ededed" strokeWidth={1.9} />
              </View>
              <View style={S.modeBadge}>
                <Text style={S.modeBadgeText}>HOST</Text>
              </View>
            </View>
            <View style={S.modeCardBody}>
              <Text style={S.modeTitle}>New Meeting</Text>
              <Text style={S.modeDesc}>
                Create a room and invite others with a one-time code.
              </Text>
            </View>
            <View style={S.modeFooter}>
              <Text style={S.modeCtaText}>Start meeting</Text>
              <ArrowRightSmall />
            </View>
          </View>
        </Pressable>

        {/* Join Meeting card */}
        <Pressable
          style={({ pressed }) => [S.modeCard, pressed && S.modeCardPressed]}
          onPress={() => onSelect("join")}
        >
          <View style={S.modeCardInner}>
            <View style={S.modeCardTop}>
              <View style={S.modeIconWrap}>
                <LogInIcon size={22} stroke="#ededed" strokeWidth={1.9} />
              </View>
              <View style={S.modeBadge}>
                <Text style={S.modeBadgeText}>JOIN</Text>
              </View>
            </View>
            <View style={S.modeCardBody}>
              <Text style={S.modeTitle}>Join Meeting</Text>
              <Text style={S.modeDesc}>
                Enter a host's code to request access and wait in the lobby.
              </Text>
            </View>
            <View style={S.modeFooter}>
              <Text style={S.modeCtaText}>Join meeting</Text>
              <ArrowRightSmall />
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create (New Meeting) view
// ─────────────────────────────────────────────────────────────────────────────
function ConferenceCreateView({
  onBack,
  expoGoBridgeHandlers,
}: {
  onBack: () => void;
  expoGoBridgeHandlers?: ExpoGoBridgeHandlers;
}) {
  const { username } = useProfileStore();
  const { setRoomInfo, setStatus } = useConferenceStore();
  const isExpoGo = Constants.executionEnvironment === "storeClient";

  const [createdCode, setCreatedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const requireDevelopmentBuild = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Toast.show({ type: "error", text1: EXPO_GO_CONFERENCE_ERROR });
  };

  const generateCode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCreatedCode(generateSecureCode());
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(createdCode);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2200);
  };

  const createRoom = async () => {
    if (expoGoBridgeHandlers) {
      const roomName = createdCode || generateSecureCode();
      setCreatedCode(roomName);
      expoGoBridgeHandlers.onCreate(roomName, { autoEnter: true });
      return;
    }
    if (isExpoGo) {
      const roomName = createdCode || generateSecureCode();
      setCreatedCode(roomName);
      requireDevelopmentBuild();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const roomName = createdCode || generateSecureCode();
      const res = await fetch(`${API_BASE}/api/conference/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      setRoomInfo({ roomName: data.roomName, token: data.token, identity: data.identity, role: "host", username });
      setStatus("connecting");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConferenceSubShell title="New Meeting" onBack={onBack}>
      {/* Meeting code card */}
      <View style={S.section}>
        <View style={S.sectionTopRow}>
          <View style={S.sectionIconWrap}>
            <VideoIcon size={18} stroke="#ededed" strokeWidth={1.9} />
          </View>
          <Text style={S.cardLabel}>Meeting code</Text>
        </View>

        {createdCode ? (
          <>
            <TouchableOpacity style={S.codeBox} onPress={copyCode} activeOpacity={0.75}>
              <Text style={S.codeText}>{createdCode}</Text>
              <View style={[S.copyBtn, copied && S.copyBtnSuccess]}>
                {copied
                  ? <CheckIcon size={15} stroke="#3ecf8e" strokeWidth={2.2} />
                  : <CopyIcon size={15} stroke="#666" strokeWidth={2.2} />
                }
              </View>
            </TouchableOpacity>
            <Text style={S.hint}>
              Share this code — participants will wait for your approval.
            </Text>
          </>
        ) : (
          <>
            <Text style={S.hint}>
              Generate a code to share with others, or start immediately without one.
            </Text>
            <TouchableOpacity style={S.generateBtn} onPress={generateCode} activeOpacity={0.8}>
              <Text style={S.generateBtnText}>Generate Meeting Code</Text>
              <RefreshCwIcon size={14} stroke="#a5b4fc" strokeWidth={2} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={[S.mainBtn, loading && S.mainBtnDisabled]}
        onPress={createRoom}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={S.mainBtnText}>{loading ? "Starting…" : "Start Meeting"}</Text>
      </TouchableOpacity>

      {!createdCode && (
        <TouchableOpacity
          style={[S.secondaryBtn, loading && S.mainBtnDisabled]}
          onPress={createRoom}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={S.secondaryBtnText}>
            {loading ? "Starting…" : "Start Without Sharing"}
          </Text>
        </TouchableOpacity>
      )}

      {createdCode && (
        <TouchableOpacity onPress={generateCode} style={S.regenRow}>
          <RefreshCwIcon size={12} stroke="#444" strokeWidth={2} />
          <Text style={S.regenText}>Generate new code</Text>
        </TouchableOpacity>
      )}
    </ConferenceSubShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Join Meeting view
// ─────────────────────────────────────────────────────────────────────────────
function ConferenceJoinView({
  onBack,
  expoGoBridgeHandlers,
}: {
  onBack: () => void;
  expoGoBridgeHandlers?: ExpoGoBridgeHandlers;
}) {
  const { username } = useProfileStore();
  const { setRoomInfo, setStatus } = useConferenceStore();
  const isExpoGo = Constants.executionEnvironment === "storeClient";

  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const autoJoinedRef = useRef(false);

  const requireDevelopmentBuild = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Toast.show({ type: "error", text1: EXPO_GO_CONFERENCE_ERROR });
  };

  useEffect(() => {
    if (loading || autoJoinedRef.current) return;
    const parts = joinCode.trim().toUpperCase().split("-");
    if (parts.length === 2 && parts[0].length >= 3 && parts[1].length >= 3) {
      autoJoinedRef.current = true;
      joinRoom();
    }
  }, [joinCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) { Toast.show({ type: "error", text1: "Enter a room code" }); return; }
    if (expoGoBridgeHandlers) { expoGoBridgeHandlers.onJoin(code, { autoEnter: true }); return; }
    if (isExpoGo) { requireDevelopmentBuild(); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/conference/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: code, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Room not found");
      setRoomInfo({ roomName: data.roomName || code, token: data.token, identity: data.identity, role: "participant", username });
      setStatus("connecting");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConferenceSubShell title="Join Meeting" onBack={onBack}>
      {/* Code entry card */}
      <View style={S.section}>
        <View style={S.sectionTopRow}>
          <View style={S.sectionIconWrap}>
            <LogInIcon size={18} stroke="#ededed" strokeWidth={1.9} />
          </View>
          <Text style={S.cardLabel}>Meeting code</Text>
        </View>

        <TextInput
          style={S.codeInput}
          placeholder="WORD-WORD"
          placeholderTextColor="#2e2e2e"
          value={joinCode}
          onChangeText={(t) => {
            autoJoinedRef.current = false;
            setJoinCode(t.toUpperCase());
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="join"
          onSubmitEditing={joinRoom}
          autoFocus
        />
        <Text style={S.hint}>
          You'll wait in the lobby until the host admits you.
        </Text>
      </View>

      <TouchableOpacity
        style={[S.mainBtn, (!joinCode.trim() || loading) && S.mainBtnDisabled]}
        onPress={joinRoom}
        disabled={!joinCode.trim() || loading}
        activeOpacity={0.8}
      >
        <Text style={S.mainBtnText}>{loading ? "Joining…" : "Join Meeting"}</Text>
      </TouchableOpacity>
    </ConferenceSubShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-shell (back button + scroll)
// ─────────────────────────────────────────────────────────────────────────────
function ConferenceSubShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = Math.max(insets.bottom, 12) + DOCK_HEIGHT + DOCK_GAP;

  return (
    <SafeAreaView style={S.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={S.scroll}
          contentContainerStyle={[S.subContent, { paddingBottom: scrollPaddingBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={S.subHeader}>
            <TouchableOpacity onPress={onBack} style={S.backBtn}>
              <ArrowLeftIcon size={18} stroke="#ededed" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={S.subTitle}>{title}</Text>
            <View style={S.backBtnPlaceholder} />
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export function ConferenceView({ expoGoBridgeHandlers }: ConferenceViewProps = {}) {
  const { status, reset } = useConferenceStore();
  const [mode, setMode] = useState<ConferenceMode>("hub");

  // Reset stale store state when navigating back to this tab
  const routeRefreshNonce = useMainNavigationStore((s) => s.routeRefreshNonce);
  const skipFirstNonce = useRef(true);
  useEffect(() => {
    if (skipFirstNonce.current) { skipFirstNonce.current = false; return; }
    if (status === "idle") return; // already clean
    reset();
    setMode("hub");
  }, [routeRefreshNonce]);

  if (status !== "idle") {
    return (
      <ConferenceRoom
        livekitUrl={LIVEKIT_URL}
        onLeave={() => { reset(); setMode("hub"); }}
      />
    );
  }

  if (mode === "create") {
    return (
      <ConferenceCreateView
        onBack={() => setMode("hub")}
        expoGoBridgeHandlers={expoGoBridgeHandlers}
      />
    );
  }

  if (mode === "join") {
    return (
      <ConferenceJoinView
        onBack={() => setMode("hub")}
        expoGoBridgeHandlers={expoGoBridgeHandlers}
      />
    );
  }

  return <ConferenceHub onSelect={setMode} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function ArrowRightSmall() {
  const { ArrowRight } = require("lucide-react-native");
  const Icon = ArrowRight as any;
  return <Icon size={13} stroke="#555" strokeWidth={2.2} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0d0d0d" },
  scroll: { flex: 1, backgroundColor: "#0d0d0d" },

  // ── Hub
  hubContent: {
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
    paddingBottom: 28,
    gap: 14,
    overflow: "hidden",
  },
  heroOrb: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(165,180,252,0.08)",
    top: -80,
    right: -70,
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
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#a5b4fc",
  },
  brandText: {
    color: "#a5b4fc",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  heroPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroPillText: {
    color: "#555",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#ededed",
    fontSize: 38,
    fontWeight: "800",
    lineHeight: 44,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  heroSubtitle: {
    color: "#5c5c5c",
    fontSize: 14,
    lineHeight: 21,
  },

  // ── Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionTitle: { color: "#ededed", fontSize: 17, fontWeight: "800" },
  sectionMeta: { color: "#444", fontSize: 12, fontWeight: "700" },

  // ── Mode cards
  modeCard: {
    borderRadius: 22,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modeCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.984 }],
  },
  modeCardInner: { padding: 20, gap: 14 },
  modeCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeBadgeText: { color: "#555", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  modeCardBody: { gap: 5 },
  modeTitle: { color: "#ededed", fontSize: 19, fontWeight: "700" },
  modeDesc: { color: "#5a5a5a", fontSize: 13, lineHeight: 19 },
  modeFooter: { flexDirection: "row", alignItems: "center", gap: 5 },
  modeCtaText: { color: "#555", fontSize: 13, fontWeight: "600" },

  // ── SubShell
  subContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPlaceholder: { width: 38 },
  subTitle: { fontSize: 16, fontWeight: "700", color: "#ededed", letterSpacing: -0.2 },

  // ── Section card
  section: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    padding: 20,
    gap: 14,
  },
  sectionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },

  // Code display (create)
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  codeText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: "#ededed",
    letterSpacing: 3,
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  copyBtnSuccess: {
    backgroundColor: "rgba(62,207,142,0.10)",
    borderColor: "rgba(62,207,142,0.18)",
  },

  // Code input (join)
  codeInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#ededed",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 3,
  },

  hint: { fontSize: 12, color: "#4a4a4a", lineHeight: 18 },

  // Generate button
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.16)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(165,180,252,0.05)",
  },
  generateBtnText: { fontSize: 14, fontWeight: "600", color: "#a5b4fc" },

  // Main button
  mainBtn: {
    backgroundColor: "#3ecf8e",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtnDisabled: { opacity: 0.4 },
  mainBtnText: { fontSize: 15, fontWeight: "700", color: "#08110d" },

  // Secondary button
  secondaryBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", color: "#888" },

  regenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  regenText: { fontSize: 12, color: "#444" },
});
