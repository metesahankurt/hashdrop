import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import {
  Video,
  Plus,
  LogIn,
  Copy,
  Check,
  ArrowRight,
  Lock,
  Users,
  MessageSquare,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useConferenceStore } from "@/store/use-conference-store";
import { useProfileStore } from "@/mobile/state/use-profile-store";
import { generateSecureCode } from "@/lib/code-generator";
import { ConferenceRoom } from "./ConferenceRoom";

const LIVEKIT_URL =
  process.env.EXPO_PUBLIC_LIVEKIT_URL || "wss://your-project.livekit.cloud";
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "https://your-hashdrop-domain.com";
const EXPO_GO_CONFERENCE_ERROR =
  "Conference requires a development build.\n\nRun:\n  npx expo run:ios\n  npx expo run:android";
const FLOATING_DOCK_HEIGHT = 74;

type Tab = "create" | "join";

interface ExpoGoBridgeHandlers {
  onCreate: (code: string, options?: { autoEnter?: boolean }) => void;
  onJoin: (code: string, options?: { autoEnter?: boolean }) => void;
}

interface ConferenceViewProps {
  expoGoBridgeHandlers?: ExpoGoBridgeHandlers;
}

export function ConferenceView({
  expoGoBridgeHandlers,
}: ConferenceViewProps = {}) {
  const insets = useSafeAreaInsets();
  const { username } = useProfileStore();
  const { status, setRoomInfo, setStatus, reset } = useConferenceStore();

  const [tab, setTab] = useState<Tab>("create");
  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const isExpoGo = Constants.executionEnvironment === "storeClient";
  const dockClearance = Math.max(insets.bottom, 10) + FLOATING_DOCK_HEIGHT;
  const autoJoinedRef = useRef(false);

  // Auto-join when a complete WORD-WORD code is typed/pasted in the join tab
  useEffect(() => {
    if (tab !== "join" || loading || autoJoinedRef.current) return;
    const parts = joinCode.trim().toUpperCase().split("-");
    if (parts.length === 2 && parts[0].length >= 3 && parts[1].length >= 3) {
      autoJoinedRef.current = true;
      joinRoom();
    }
  }, [joinCode]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (isExpoGo) {
      const roomName = createdCode || generateSecureCode();
      setCreatedCode(roomName);
      if (expoGoBridgeHandlers) {
        expoGoBridgeHandlers.onCreate(roomName, {
          autoEnter: true,
        });
        return;
      }
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
      setRoomInfo({
        roomName: data.roomName,
        token: data.token,
        identity: data.identity,
        role: "host",
        username,
      });
      setStatus("connecting");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      Toast.show({ type: "error", text1: "Enter a room code" });
      return;
    }
    if (isExpoGo) {
      if (expoGoBridgeHandlers) {
        expoGoBridgeHandlers.onJoin(code, { autoEnter: true });
        return;
      }
      requireDevelopmentBuild();
      return;
    }
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
      setRoomInfo({
        roomName: data.roomName || code,
        token: data.token,
        identity: data.identity,
        role: "participant",
        username,
      });
      setStatus("connecting");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (status !== "idle") {
    return (
      <ConferenceRoom
        livekitUrl={LIVEKIT_URL}
        onLeave={() => {
          reset();
          setCreatedCode("");
          setJoinCode("");
        }}
      />
    );
  }

  return (
    <View style={S.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <View style={S.hero} pointerEvents="none">
        <View style={S.heroIconRing}>
          <View style={S.heroIcon}>
            <Video size={32} color="#3ecf8e" />
          </View>
        </View>
        <Text style={S.heroTitle}>Conference</Text>
        <Text style={S.heroSub}>
          Encrypted · up to 50 participants
        </Text>

        {/* Feature pills */}
        <View style={S.pills}>
          {[
            { icon: <Lock size={11} color="#3ecf8e" />, label: "End-to-end encrypted" },
            { icon: <Users size={11} color="#818cf8" />, label: "50 people" },
            { icon: <MessageSquare size={11} color="#fb923c" />, label: "In-call chat" },
          ].map((p) => (
            <View key={p.label} style={S.pill}>
              {p.icon}
              <Text style={S.pillText}>{p.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Bottom Card ───────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={S.cardWrapper}
      >
        <BlurView
          intensity={60}
          tint="dark"
          style={[
            S.card,
            {
              paddingBottom:
                (Platform.OS === "ios" ? 32 : 20) + dockClearance,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={S.handle} />

          {/* Tabs */}
          <View style={S.tabRow}>
            {(["create", "join"] as Tab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[S.tab, tab === t && S.tabActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTab(t);
                  if (t === "join") autoJoinedRef.current = false;
                }}
                activeOpacity={0.8}
              >
                {t === "create" ? (
                  <Plus size={14} color={tab === t ? "#3ecf8e" : "#666"} />
                ) : (
                  <LogIn size={14} color={tab === t ? "#3ecf8e" : "#666"} />
                )}
                <Text style={[S.tabText, tab === t && S.tabTextActive]}>
                  {t === "create" ? "New Meeting" : "Join Meeting"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Create tab ─────────────────────────────────────── */}
          {tab === "create" && (
            <View style={S.tabContent}>
              {createdCode ? (
                <>
                  <Text style={S.fieldLabel}>Meeting Code</Text>
                  <TouchableOpacity
                    style={S.codeBox}
                    onPress={copyCode}
                    activeOpacity={0.75}
                  >
                    <Text style={S.codeText}>{createdCode}</Text>
                    <View style={[S.copyBtn, copied && S.copyBtnSuccess]}>
                      {copied ? (
                        <Check size={16} color="#3ecf8e" />
                      ) : (
                        <Copy size={16} color="#8b8b8b" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={S.hint}>
                    Share this code — participants will wait for your approval.
                  </Text>
                  <TouchableOpacity
                    style={[S.mainBtn, loading && S.mainBtnDisabled]}
                    onPress={createRoom}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={S.mainBtnText}>
                      {loading ? "Starting…" : "Start Meeting"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={generateCode} style={S.regenBtn}>
                    <Text style={S.regenText}>Generate a new code</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={S.hint}>
                    Generate a meeting code to share with others, or start immediately.
                  </Text>
                  <TouchableOpacity
                    style={S.generateBtn}
                    onPress={generateCode}
                    activeOpacity={0.8}
                  >
                    <Text style={S.generateBtnText}>Generate Meeting Code</Text>
                    <ArrowRight size={16} color="#3ecf8e" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.mainBtn, S.mainBtnSecondary, loading && S.mainBtnDisabled]}
                    onPress={createRoom}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={[S.mainBtnText, S.mainBtnTextSecondary]}>
                      {loading ? "Starting…" : "Start Without Sharing"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── Join tab ────────────────────────────────────────── */}
          {tab === "join" && (
            <View style={S.tabContent}>
              <Text style={S.fieldLabel}>Meeting Code</Text>
              <TextInput
                style={S.codeInput}
                placeholder="WORD-WORD"
                placeholderTextColor="#444"
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="join"
                onSubmitEditing={joinRoom}
              />
              <Text style={S.hint}>
                You'll wait in the waiting room until the host admits you.
              </Text>
              <TouchableOpacity
                style={[
                  S.mainBtn,
                  (!joinCode.trim() || loading) && S.mainBtnDisabled,
                ]}
                onPress={joinRoom}
                disabled={!joinCode.trim() || loading}
                activeOpacity={0.8}
              >
                <Text style={S.mainBtnText}>
                  {loading ? "Joining…" : "Join Meeting"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0a0a0a" },

  // Hero
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    gap: 10,
  },
  heroIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(62,207,142,0.07)",
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(62,207,142,0.12)",
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ededed",
    letterSpacing: -0.5,
  },
  heroSub: { fontSize: 14, color: "#666", textAlign: "center" },
  pills: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 4 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: { fontSize: 11, color: "#888" },

  // Bottom card
  cardWrapper: { flexShrink: 0 },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 4,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "rgba(62,207,142,0.1)",
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.2)",
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#666" },
  tabTextActive: { color: "#3ecf8e" },

  // Tab content
  tabContent: { gap: 12 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Code display (create)
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  codeText: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#ededed",
    letterSpacing: 4,
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  copyBtnSuccess: { backgroundColor: "rgba(62,207,142,0.12)" },

  // Code input (join)
  codeInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: "#ededed",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 4,
  },

  hint: { fontSize: 12, color: "#555", lineHeight: 18 },

  // Generate button
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.2)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "rgba(62,207,142,0.05)",
  },
  generateBtnText: { fontSize: 15, fontWeight: "600", color: "#3ecf8e" },

  // Main action button
  mainBtn: {
    backgroundColor: "#3ecf8e",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtnSecondary: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  mainBtnDisabled: { opacity: 0.45 },
  mainBtnText: { fontSize: 16, fontWeight: "700", color: "#0a0a0a" },
  mainBtnTextSecondary: { color: "#ededed" },

  regenBtn: { alignItems: "center", paddingVertical: 2 },
  regenText: { fontSize: 12, color: "#555" },
});
