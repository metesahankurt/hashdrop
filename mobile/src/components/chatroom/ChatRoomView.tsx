import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useMainNavigationStore } from "@/mobile/navigation/use-main-navigation-store";

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

function rightRotate(value: number, amount: number) {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Fallback(message: string): string {
  const words: number[] = [];
  const messageBytes = Array.from(new TextEncoder().encode(message));
  const bitLength = messageBytes.length * 8;

  for (let index = 0; index < messageBytes.length; index += 1) {
    words[index >> 2] |= messageBytes[index] << (24 - (index % 4) * 8);
  }

  words[bitLength >> 5] |= 0x80 << (24 - bitLength % 32);
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Array<number>(64);

  for (let offset = 0; offset < words.length; offset += 16) {
    for (let index = 0; index < 16; index += 1) {
      w[index] = words[offset + index] | 0;
    }

    for (let index = 16; index < 64; index += 1) {
      const s0 = rightRotate(w[index - 15], 7) ^ rightRotate(w[index - 15], 18) ^ (w[index - 15] >>> 3);
      const s1 = rightRotate(w[index - 2], 17) ^ rightRotate(w[index - 2], 19) ^ (w[index - 2] >>> 10);
      w[index] = (((w[index - 16] + s0) | 0) + ((w[index - 7] + s1) | 0)) | 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let index = 0; index < 64; index += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = ((((h + s1) | 0) + ((ch + k[index]) | 0)) + w[index]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((value) => (value >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

async function hashPassword(password: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    return sha256Fallback(password);
  }

  const data = new TextEncoder().encode(password);
  const hashBuffer = await subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createAutofillScript(password: string, topPx: number) {
  const escapedPassword = JSON.stringify(password);

  return `
    (function() {
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overscrollBehavior = 'none';

      var password = ${escapedPassword};
      var hasPassword = !!password;

      function applyTopInset() {
        var el = document.querySelector('div.fixed.top-0');
        if (el) {
          el.style.paddingTop = '${topPx}px';
          return true;
        }
        return false;
      }

      function findPasswordInput() {
        var inputs = Array.prototype.slice.call(document.querySelectorAll('input'));
        return inputs.find(function(input) {
          var type = (input.getAttribute('type') || '').toLowerCase();
          var name = ((input.getAttribute('name') || '') + ' ' + (input.getAttribute('placeholder') || '') + ' ' + (input.getAttribute('aria-label') || '')).toLowerCase();
          return type === 'password' || name.indexOf('password') >= 0 || name.indexOf('passcode') >= 0;
        });
      }

      function clickJoinButton() {
        var controls = Array.prototype.slice.call(document.querySelectorAll('button, [role="button"], a'));
        var button = controls.find(function(node) {
          var text = (node.textContent || '').trim().toLowerCase();
          return text === 'join' || text === 'join room' || text === 'enter room' || text === 'continue' || text === 'connect' || text === 'unlock';
        });
        if (button) {
          button.click();
          return true;
        }
        return false;
      }

      function autofillPassword() {
        if (!hasPassword) {
          return clickJoinButton();
        }

        var input = findPasswordInput();
        if (!input) {
          return false;
        }

        var descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (descriptor && descriptor.set) {
          descriptor.set.call(input, password);
        } else {
          input.value = password;
        }

        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return clickJoinButton();
      }

      applyTopInset();

      var attempts = 0;
      var timer = setInterval(function() {
        attempts += 1;
        applyTopInset();
        if (autofillPassword() || attempts > 60) {
          clearInterval(timer);
        }
      }, 250);
    })();
    true;
  `;
}

export function ChatRoomView() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Dock sits at Math.max(insets.bottom, 10) from screen bottom and is 64px tall (46 item + 9+9 padding).
  const dockClearance = Math.max(insets.bottom, 10) + 64;
  const { username: profileUsername } = useProfileStore();
  const { status, roomName, username: storeUsername, setRoomInfo, setStatus, addMessage, reset } = useChatRoomStore();
  // Always prefer profileUsername so the user never has to type their name again
  const username = profileUsername || storeUsername;
  const [mode, setMode] = useState<"select" | "join">("select");
  const [joinCode, setJoinCode] = useState("");
  const [password, setPassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [webPassword, setWebPassword] = useState("");
  const isExpoGo = Constants.executionEnvironment === "storeClient";

  // When the user presses the Chat dock button while already on this screen,
  // the navigation store increments routeRefreshNonce — use that to go back to select.
  const routeRefreshNonce = useMainNavigationStore((s) => s.routeRefreshNonce);
  const skipFirstNonce = useRef(true);
  useEffect(() => {
    if (skipFirstNonce.current) { skipFirstNonce.current = false; return; }
    reset();
    setMode("select");
    setJoinCode("");
    setPassword("");
    setJoinPassword("");
    setWebPassword("");
  }, [routeRefreshNonce]);

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
      setWebPassword(password.trim());
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
      setWebPassword(joinPassword.trim());
      setRoomInfo({ roomName: data.roomName || code, token: data.token, identity: data.identity, username, hasPassword: !!joinPassword.trim() });
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
    setPassword("");
    setJoinPassword("");
    setWebPassword("");
  };

  if (status === "connected") {
    const displayName = username || `User-${roomName.slice(-4)}`;
    const params = new URLSearchParams({
      autoAccept: "1",
      from: displayName,
      topInset: `${Math.round(insets.top)}`,
    });
    if (webPassword) {
      params.set("password", webPassword);
      params.set("pwd", "1");
    }
    const chatUrl = `${API_BASE}/chatroom/${encodeURIComponent(roomName)}?${params.toString()}`;
    const topPx = Math.round(insets.top);
    return (
      <ChatWebView
        chatUrl={chatUrl}
        password={webPassword}
        topPx={topPx}
        dockClearance={dockClearance}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Math.max(insets.top, 12)}
    >
      <AppShell
        title="Chat Room"
        subtitle="Private room-based messaging — create a space or join one with a code."
      >
        {/* Hero card */}
        <View style={[styles.heroCard, width < 390 && styles.heroCardCompact]}>
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />

          <View style={styles.heroTopRow}>
            <Text style={styles.heroKicker}>ROOM MESSAGING</Text>
            <View style={styles.heroPill}>
              <LockIcon size={11} stroke={ACCENT} strokeWidth={2.4} />
              <Text style={styles.heroPillText}>Encrypted</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, width < 390 && styles.heroTitleCompact]}>Start a private room in seconds.</Text>
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
                returnKeyType="go"
                onSubmitEditing={handleCreate}
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
              returnKeyType="next"
            />
            <TextField
              label="Password (if required)"
              placeholder="Leave empty if no password"
              value={joinPassword}
              onChangeText={setJoinPassword}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleJoin}
            />

            <PrimaryButton
              onPress={handleJoin}
              disabled={loading || !isValidCode(joinCode.trim().toUpperCase())}
            >
              {loading ? "Connecting…" : "Join room"}
            </PrimaryButton>

            <PrimaryButton onPress={() => { setMode("select"); setJoinCode(""); setJoinPassword(""); }} tone="secondary">
              Back
            </PrimaryButton>
          </View>
        )}
      </AppShell>
    </KeyboardAvoidingView>
  );
}

function ChatWebView({
  chatUrl,
  password,
  topPx,
  dockClearance,
  onLeave,
}: {
  chatUrl: string;
  password: string;
  topPx: number;
  dockClearance: number;
  onLeave: () => void;
}) {
  const [webLoaded, setWebLoaded] = useState(false);
  const injectedJavaScript = createAutofillScript(password, topPx);

  return (
    <View style={{ flex: 1, paddingBottom: dockClearance, backgroundColor: "#0d0d0d" }}>
      <WebView
        source={{ uri: chatUrl }}
        style={{ flex: 1, opacity: webLoaded ? 1 : 0 }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        injectedJavaScript={injectedJavaScript}
        onLoadEnd={() => setWebLoaded(true)}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { type: string };
            if (data.type === "leave") onLeave();
          } catch {}
        }}
        onNavigationStateChange={(state) => {
          if (state.url && !state.url.includes("/chatroom/")) onLeave();
        }}
      />

      {!webLoaded && (
        <View style={loadingStyles.overlay}>
          <View style={loadingStyles.card}>
            <ActivityIndicator size="large" color="#3ecf8e" />
            <Text style={loadingStyles.text}>Connecting to room…</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  text: {
    color: "#8b8b8b",
    fontSize: 14,
    fontWeight: "600",
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
  heroCardCompact: {
    padding: 16,
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
  heroTitleCompact: {
    fontSize: 22,
    lineHeight: 26,
    maxWidth: "100%",
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
