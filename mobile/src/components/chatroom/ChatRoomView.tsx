import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Lock, MessageSquare, Plus, LogIn } from "lucide-react-native";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";

import { AppShell } from "@/mobile/components/AppShell";
import { PrimaryButton } from "@/mobile/components/PrimaryButton";
import { TextField } from "@/mobile/components/TextField";
import { generateSecureCode, isValidCode } from "@/lib/code-generator";
import { useChatRoomStore } from "@/store/use-chat-room-store";
import { useProfileStore } from "@/mobile/state/use-profile-store";

const PlusIcon = Plus as any;
const LogInIcon = LogIn as any;
const LockIcon = Lock as any;
const MessageSquareIcon = MessageSquare as any;

const ACCENT = "#f59e0b";
const LIVEKIT_URL =
  process.env.EXPO_PUBLIC_LIVEKIT_URL || "wss://your-project.livekit.cloud";
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "https://hashdrop.metesahankurt.cloud";

const EXPO_GO_ERROR =
  "Chat room requires a development build.\n\nRun:\n  npx expo run:ios\n  npx expo run:android";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function ChatRoomView() {
  const { username: profileUsername } = useProfileStore();
  const { status, roomName, username: storeUsername, setRoomInfo, setStatus, addMessage, reset } = useChatRoomStore();
  const username = storeUsername || profileUsername;
  const [mode, setMode] = useState<"select" | "join">("select");
  const [joinCode, setJoinCode] = useState("");
  const [password, setPassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isExpoGo = Constants.executionEnvironment === "storeClient";

  const handleCreate = async () => {
    if (isExpoGo) {
      Alert.alert("Development Build Required", EXPO_GO_ERROR);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const roomName = generateSecureCode();
      const passwordHash = password.trim() ? await hashPassword(password.trim()) : null;
      console.log('[ChatRoom][MOBILE] handleCreate — roomName:', roomName, 'API:', API_BASE, 'LIVEKIT_URL:', LIVEKIT_URL);
      const res = await fetch(`${API_BASE}/api/chatroom/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, username, passwordHash }),
      });
      const data = await res.json();
      console.log('[ChatRoom][MOBILE] create response status:', res.status, 'data:', JSON.stringify(data).slice(0, 200));
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      setRoomInfo({ roomName: data.roomName, token: data.token, identity: data.identity, username, hasPassword: !!password.trim() });
      addMessage({
        id: `sys-${Date.now()}`,
        type: "system",
        sender: "system",
        senderIdentity: "system",
        content: `Room ${data.roomName} created. Share the code to invite others.`,
        timestamp: Date.now(),
      });
      setStatus("connected");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!isValidCode(code)) {
      Toast.show({ type: "error", text1: "Invalid room code" });
      return;
    }
    if (isExpoGo) {
      Alert.alert("Development Build Required", EXPO_GO_ERROR);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const passwordHash = joinPassword.trim() ? await hashPassword(joinPassword.trim()) : null;
      console.log('[ChatRoom][MOBILE] handleJoin — code:', code, 'API:', API_BASE, 'LIVEKIT_URL:', LIVEKIT_URL);
      const res = await fetch(`${API_BASE}/api/chatroom/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: code, username, passwordHash }),
      });
      const data = await res.json();
      console.log('[ChatRoom][MOBILE] join response status:', res.status, 'data:', JSON.stringify(data).slice(0, 200));
      if (!res.ok) throw new Error(data.error || "Room not found");
      setRoomInfo({ roomName: data.roomName || code, token: data.token, identity: data.identity, username });
      addMessage({
        id: `sys-${Date.now()}`,
        type: "system",
        sender: "system",
        senderIdentity: "system",
        content: `You joined room ${data.roomName || code}.`,
        timestamp: Date.now(),
      });
      setStatus("connected");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    reset();
    setMode("select");
    setJoinCode("");
  };

  if (status === "connected") {
    const displayName = username || `User-${roomName.slice(-4)}`;
    const chatUrl = `${API_BASE}/chatroom/${encodeURIComponent(roomName)}?autoAccept=1&from=${encodeURIComponent(displayName)}`;
    return (
      <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
        <WebView
          source={{ uri: chatUrl }}
          style={{ flex: 1 }}
          onNavigationStateChange={(state) => {
            if (state.url && !state.url.includes("/chatroom/")) {
              handleLeave();
            }
          }}
        />
      </View>
    );
  }

  return (
    <AppShell
      title="Chat Room"
      subtitle="Private room-based messaging — create a space or join one with a code."
    >
      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />

        <View style={styles.heroTopRow}>
          <Text style={styles.heroKicker}>ROOM MESSAGING</Text>
          <View style={styles.heroPill}>
            <LockIcon size={11} stroke={ACCENT} strokeWidth={2.4} />
            <Text style={styles.heroPillText}>Encrypted</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Start a private room in seconds.</Text>
        <Text style={styles.heroSubtitle}>
          Share a code and chat in real time. No accounts, no history.
        </Text>

        <View style={styles.chipRow}>
          <View style={styles.chip}><Text style={styles.chipText}>Code-based entry</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>E2E encrypted</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Up to 50 people</Text></View>
        </View>
      </View>

      {mode === "select" && (
        <>
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, { backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}2f` }]}>
                <PlusIcon size={20} stroke={ACCENT} strokeWidth={2.2} />
              </View>
              <View style={[styles.badge, { backgroundColor: `${ACCENT}14`, borderColor: `${ACCENT}2b` }]}>
                <Text style={[styles.badgeText, { color: ACCENT }]}>CREATE</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Create a room</Text>
            <Text style={styles.cardDesc}>
              Generate a room code and share it with anyone you want to chat with.
            </Text>
            <TextField
              label="Password (optional)"
              placeholder="Leave empty for no password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <PrimaryButton onPress={handleCreate} disabled={loading}>
              {loading ? "Creating…" : "Create room"}
            </PrimaryButton>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(129,140,248,0.12)", borderColor: "rgba(129,140,248,0.2)" }]}>
                <LogInIcon size={20} stroke="#818cf8" strokeWidth={2.2} />
              </View>
              <View style={[styles.badge, { backgroundColor: "rgba(129,140,248,0.12)", borderColor: "rgba(129,140,248,0.2)" }]}>
                <Text style={[styles.badgeText, { color: "#818cf8" }]}>JOIN</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Join a room</Text>
            <Text style={styles.cardDesc}>
              Enter a room code to join an existing chat session.
            </Text>
            <PrimaryButton onPress={() => setMode("join")} tone="secondary">
              Join room
            </PrimaryButton>
          </View>
        </>
      )}

      {mode === "join" && (
        <View style={styles.formCard}>
          <View style={styles.cardTop}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(129,140,248,0.12)", borderColor: "rgba(129,140,248,0.2)" }]}>
              <MessageSquareIcon size={20} stroke="#818cf8" strokeWidth={2.2} />
            </View>
            <View style={[styles.badge, { backgroundColor: "rgba(129,140,248,0.12)", borderColor: "rgba(129,140,248,0.2)" }]}>
              <Text style={[styles.badgeText, { color: "#818cf8" }]}>JOIN</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>Enter room code</Text>

          <TextField
            label="Room code"
            placeholder="COSMIC-FALCON"
            value={joinCode}
            onChangeText={(t) => setJoinCode(t.toUpperCase())}
            autoCapitalize="characters"
          />
          <TextField
            label="Password (if required)"
            placeholder="Leave empty if no password"
            value={joinPassword}
            onChangeText={setJoinPassword}
            secureTextEntry
          />

          <PrimaryButton
            onPress={handleJoin}
            disabled={loading || !isValidCode(joinCode.trim().toUpperCase())}
          >
            {loading ? "Connecting…" : "Join room"}
          </PrimaryButton>

          <PrimaryButton onPress={() => { setMode("select"); setJoinCode(""); }} tone="secondary">
            Back
          </PrimaryButton>
        </View>
      )}
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
  orbLarge: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(245,158,11,0.12)",
    top: -60,
    right: -50,
  },
  orbSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -36,
    left: -30,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroKicker: { color: ACCENT, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroPillText: { color: ACCENT, fontSize: 11, fontWeight: "800" },
  heroTitle: {
    color: "#ededed",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 30,
    maxWidth: "85%",
  },
  heroSubtitle: { color: "#8b8b8b", fontSize: 13, lineHeight: 19, maxWidth: "90%" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipText: { color: "#d4d4d4", fontSize: 11, fontWeight: "700" },
  card: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 12,
  },
  formCard: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 14,
  },
  cardTop: {
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
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  cardTitle: { color: "#ededed", fontSize: 18, fontWeight: "700" },
  cardDesc: { color: "#8b8b8b", fontSize: 13, lineHeight: 19 },
});
