import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Lock, MessageSquare, Plus, LogIn, Eye, EyeOff } from "lucide-react-native";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";

import { generateSecureCode, isValidCode } from "@/lib/code-generator";
import { useChatRoomStore } from "@/store/use-chat-room-store";
import { useProfileStore } from "@/mobile/state/use-profile-store";
import { useMainNavigationStore } from "@/mobile/navigation/use-main-navigation-store";

const PlusIcon = Plus as any;
const LogInIcon = LogIn as any;
const LockIcon = Lock as any;
const MessageSquareIcon = MessageSquare as any;
const EyeIcon = Eye as any;
const EyeOffIcon = EyeOff as any;

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "https://hashdrop.metesahankurt.cloud";

const EXPO_GO_ERROR =
  "Chat room requires a development build.\n\nRun:\n  npx expo run:ios\n  npx expo run:android";

const DOCK_HEIGHT = 64;
const DOCK_GAP = 24;

type ChatMode = "select" | "create" | "join";

// ─────────────────────────────────────────────────────────────────────────────
// SHA-256 utility (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
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
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Array<number>(64);
  for (let offset = 0; offset < words.length; offset += 16) {
    for (let index = 0; index < 16; index += 1) w[index] = words[offset + index] | 0;
    for (let index = 16; index < 64; index += 1) {
      const s0 = rightRotate(w[index - 15], 7) ^ rightRotate(w[index - 15], 18) ^ (w[index - 15] >>> 3);
      const s1 = rightRotate(w[index - 2], 17) ^ rightRotate(w[index - 2], 19) ^ (w[index - 2] >>> 10);
      w[index] = (((w[index - 16] + s0) | 0) + ((w[index - 7] + s1) | 0)) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = ((((h + s1) | 0) + ((ch + k[index]) | 0)) + w[index]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((value) => (value >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

async function hashPassword(password: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return sha256Fallback(password);
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
      function injectHideStyles() {
        if (document.getElementById('hashdrop-mobile-hide-notifications')) return;
        var style = document.createElement('style');
        style.id = 'hashdrop-mobile-hide-notifications';
        style.textContent = [
          '[data-sonner-toaster], .sonner-toaster, .toast-container, .toaster, .hot-toast, [data-toast], [data-toaster] { display: none !important; }',
          '[role="alert"], [role="status"] { display: none !important; }',
          '[aria-live="polite"], [aria-live="assertive"] { display: none !important; }'
        ].join('\\n');
        document.head.appendChild(style);
      }
      function hideNotifications() {
        var selectors = ['[data-sonner-toaster]','.sonner-toaster','.toast-container','.toaster','.hot-toast','[data-toast]','[data-toaster]','[role="alert"]','[role="status"]','[aria-live="polite"]','[aria-live="assertive"]'];
        selectors.forEach(function(selector) {
          Array.prototype.forEach.call(document.querySelectorAll(selector), function(node) {
            if (node && node.style) { node.style.display = 'none'; node.style.visibility = 'hidden'; node.style.pointerEvents = 'none'; }
          });
        });
      }
      function applyTopInset() {
        var el = document.querySelector('div.fixed.top-0');
        if (el) { el.style.paddingTop = '${topPx}px'; return true; }
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
        if (button) { button.click(); return true; }
        return false;
      }
      function autofillPassword() {
        if (!hasPassword) return clickJoinButton();
        var input = findPasswordInput();
        if (!input) return false;
        var descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (descriptor && descriptor.set) { descriptor.set.call(input, password); } else { input.value = password; }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return clickJoinButton();
      }
      injectHideStyles(); hideNotifications(); applyTopInset();
      var observer = new MutationObserver(function() { injectHideStyles(); hideNotifications(); applyTopInset(); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      var attempts = 0;
      var timer = setInterval(function() {
        attempts += 1; hideNotifications(); applyTopInset();
        if (autofillPassword() || attempts > 60) clearInterval(timer);
      }, 250);
    })();
    true;
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-shell wrapper
// ─────────────────────────────────────────────────────────────────────────────
function ChatSubShell({
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
              <ArrowLeftIcon />
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

function ArrowLeftIcon() {
  const { ArrowLeft } = require("lucide-react-native");
  const Icon = ArrowLeft as any;
  return <Icon size={18} stroke="#ededed" strokeWidth={2.2} />;
}

function ArrowRightSmall() {
  const { ArrowRight } = require("lucide-react-native");
  const Icon = ArrowRight as any;
  return <Icon size={13} stroke="#555" strokeWidth={2.2} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export function ChatRoomView() {
  const insets = useSafeAreaInsets();
  const dockClearance = Math.max(insets.bottom, 10) + 64;
  const scrollPaddingBottom = Math.max(insets.bottom, 12) + DOCK_HEIGHT + DOCK_GAP;

  const { username: profileUsername } = useProfileStore();
  const { status, roomName, username: storeUsername, setRoomInfo, setStatus, addMessage, reset } = useChatRoomStore();
  const username = profileUsername || storeUsername;

  const [mode, setMode] = useState<ChatMode>("select");
  const [joinCode, setJoinCode] = useState("");
  const [password, setPassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [webPassword, setWebPassword] = useState("");
  const isExpoGo = Constants.executionEnvironment === "storeClient";

  const routeRefreshNonce = useMainNavigationStore((s) => s.routeRefreshNonce);
  const skipFirstNonce = useRef(true);
  useEffect(() => {
    if (skipFirstNonce.current) { skipFirstNonce.current = false; return; }
    reset(); setMode("select"); setJoinCode(""); setPassword(""); setJoinPassword(""); setWebPassword("");
  }, [routeRefreshNonce]);

  const handleCreate = async () => {
    if (isExpoGo) { Alert.alert("Development Build Required", EXPO_GO_ERROR); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const roomName = generateSecureCode();
      const passwordHash = password.trim() ? await hashPassword(password.trim()) : null;
      const res = await fetch(`${API_BASE}/api/chatroom/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, username, passwordHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");
      setWebPassword(password.trim());
      setRoomInfo({ roomName: data.roomName, token: data.token, identity: data.identity, username, hasPassword: !!password.trim() });
      addMessage({ id: `sys-${Date.now()}`, type: "system", sender: "system", senderIdentity: "system", content: `Room ${data.roomName} created.`, timestamp: Date.now() });
      setStatus("connected");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!isValidCode(code)) { Toast.show({ type: "error", text1: "Invalid room code" }); return; }
    if (isExpoGo) { Alert.alert("Development Build Required", EXPO_GO_ERROR); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const passwordHash = joinPassword.trim() ? await hashPassword(joinPassword.trim()) : null;
      const res = await fetch(`${API_BASE}/api/chatroom/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: code, username, passwordHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Room not found");
      setWebPassword(joinPassword.trim());
      setRoomInfo({ roomName: data.roomName || code, token: data.token, identity: data.identity, username, hasPassword: !!joinPassword.trim() });
      addMessage({ id: `sys-${Date.now()}`, type: "system", sender: "system", senderIdentity: "system", content: `You joined room ${data.roomName || code}.`, timestamp: Date.now() });
      setStatus("connected");
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    reset(); setMode("select"); setJoinCode(""); setPassword(""); setJoinPassword(""); setWebPassword("");
  };

  const confirmLeave = () => {
    Alert.alert(
      "Leave Chat?",
      "Are you sure you want to leave this chat room?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: handleLeave },
      ],
      { cancelable: true }
    );
  };

  // ── Active chat room → WebView
  if (status === "connected") {
    const displayName = username || `User-${roomName.slice(-4)}`;
    const params = new URLSearchParams({ autoAccept: "1", from: displayName, topInset: `${Math.round(insets.top)}` });
    if (webPassword) { params.set("password", webPassword); params.set("pwd", "1"); }
    const chatUrl = `${API_BASE}/chatroom/${encodeURIComponent(roomName)}?${params.toString()}`;
    return (
      <ChatWebView
        chatUrl={chatUrl}
        password={webPassword}
        topPx={Math.round(insets.top)}
        dockClearance={dockClearance}
        onLeave={confirmLeave}
      />
    );
  }

  // ── Create sub-view
  if (mode === "create") {
    return (
      <ChatSubShell title="New Room" onBack={() => { setMode("select"); setPassword(""); }}>
        <View style={S.section}>
          <View style={S.sectionTopRow}>
            <View style={S.sectionIconWrap}>
              <PlusIcon size={18} stroke="#ededed" strokeWidth={1.9} />
            </View>
            <Text style={S.cardLabel}>Room settings</Text>
          </View>

          <Text style={S.hint}>
            A unique code will be generated for your room. Share it to invite others.
          </Text>

          {/* Password field */}
          <View style={S.inputGroup}>
            <Text style={S.inputLabel}>Password <Text style={S.inputLabelMuted}>(optional)</Text></Text>
            <View style={S.inputRow}>
              <TextInput
                style={S.textInput}
                placeholder="Leave empty for open room"
                placeholderTextColor="#2e2e2e"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={handleCreate}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={S.eyeBtn}>
                {showPassword
                  ? <EyeOffIcon size={16} stroke="#555" strokeWidth={2} />
                  : <EyeIcon size={16} stroke="#555" strokeWidth={2} />
                }
              </Pressable>
            </View>
          </View>

          {password.trim().length > 0 && (
            <View style={S.infoBanner}>
              <LockIcon size={12} stroke="#f59e0b" strokeWidth={2} />
              <Text style={S.infoBannerText}>Room will be password protected.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[S.mainBtn, loading && S.mainBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={S.mainBtnText}>{loading ? "Creating…" : "Create Room"}</Text>
        </TouchableOpacity>
      </ChatSubShell>
    );
  }

  // ── Join sub-view
  if (mode === "join") {
    return (
      <ChatSubShell title="Join Room" onBack={() => { setMode("select"); setJoinCode(""); setJoinPassword(""); }}>
        <View style={S.section}>
          <View style={S.sectionTopRow}>
            <View style={S.sectionIconWrap}>
              <LogInIcon size={18} stroke="#ededed" strokeWidth={1.9} />
            </View>
            <Text style={S.cardLabel}>Room code</Text>
          </View>

          <TextInput
            style={S.codeInput}
            placeholder="COSMIC-FALCON"
            placeholderTextColor="#2e2e2e"
            value={joinCode}
            onChangeText={(t) => setJoinCode(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="next"
            autoFocus
          />

          <View style={S.inputGroup}>
            <Text style={S.inputLabel}>Password <Text style={S.inputLabelMuted}>(if required)</Text></Text>
            <View style={S.inputRow}>
              <TextInput
                style={S.textInput}
                placeholder="Leave empty if open room"
                placeholderTextColor="#2e2e2e"
                value={joinPassword}
                onChangeText={setJoinPassword}
                secureTextEntry={!showJoinPassword}
                returnKeyType="go"
                onSubmitEditing={handleJoin}
              />
              <Pressable onPress={() => setShowJoinPassword((v) => !v)} style={S.eyeBtn}>
                {showJoinPassword
                  ? <EyeOffIcon size={16} stroke="#555" strokeWidth={2} />
                  : <EyeIcon size={16} stroke="#555" strokeWidth={2} />
                }
              </Pressable>
            </View>
          </View>

          <Text style={S.hint}>
            No history is stored — once everyone leaves, the room is gone.
          </Text>
        </View>

        <TouchableOpacity
          style={[S.mainBtn, (loading || !isValidCode(joinCode.trim().toUpperCase())) && S.mainBtnDisabled]}
          onPress={handleJoin}
          disabled={loading || !isValidCode(joinCode.trim().toUpperCase())}
          activeOpacity={0.8}
        >
          <Text style={S.mainBtnText}>{loading ? "Joining…" : "Join Room"}</Text>
        </TouchableOpacity>
      </ChatSubShell>
    );
  }

  // ── Hub (select)
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
              <Text style={S.brandText}>CHAT ROOM</Text>
            </View>
            <View style={S.heroPill}>
              <Text style={S.heroPillText}>ROOMS</Text>
            </View>
          </View>
          <Text style={S.heroTitle}>Private rooms,{"\n"}instant access.</Text>
          <Text style={S.heroSubtitle}>
            Code-based entry. No accounts, no history.
          </Text>
        </View>

        {/* Section header */}
        <View style={S.sectionHeader}>
          <Text style={S.sectionTitle}>Choose mode</Text>
          <Text style={S.sectionMeta}>2 options</Text>
        </View>

        {/* Create room card */}
        <Pressable
          style={({ pressed }) => [S.modeCard, pressed && S.modeCardPressed]}
          onPress={() => setMode("create")}
        >
          <View style={S.modeCardInner}>
            <View style={S.modeCardTop}>
              <View style={S.modeIconWrap}>
                <PlusIcon size={22} stroke="#ededed" strokeWidth={1.9} />
              </View>
              <View style={S.modeBadge}>
                <Text style={S.modeBadgeText}>CREATE</Text>
              </View>
            </View>
            <View style={S.modeCardBody}>
              <Text style={S.modeTitle}>New Room</Text>
              <Text style={S.modeDesc}>
                Create a room and share the code. Optionally set a password.
              </Text>
            </View>
            <View style={S.modeFooter}>
              <Text style={S.modeCtaText}>Create room</Text>
              <ArrowRightSmall />
            </View>
          </View>
        </Pressable>

        {/* Join room card */}
        <Pressable
          style={({ pressed }) => [S.modeCard, pressed && S.modeCardPressed]}
          onPress={() => setMode("join")}
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
              <Text style={S.modeTitle}>Join Room</Text>
              <Text style={S.modeDesc}>
                Enter a room code to join an existing session instantly.
              </Text>
            </View>
            <View style={S.modeFooter}>
              <Text style={S.modeCtaText}>Join room</Text>
              <ArrowRightSmall />
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat WebView (unchanged logic, refined loading card)
// ─────────────────────────────────────────────────────────────────────────────
function ChatWebView({
  chatUrl, password, topPx, dockClearance, onLeave,
}: {
  chatUrl: string;
  password: string;
  topPx: number;
  dockClearance: number;
  onLeave: () => void;
}) {
  const [webReady, setWebReady] = useState(false);
  const injectedJavaScript = createAutofillScript(password, topPx);

  return (
    <View style={{ flex: 1, paddingBottom: dockClearance, backgroundColor: "#0d0d0d" }}>
      <WebView
        source={{ uri: chatUrl }}
        style={{ flex: 1, opacity: webReady ? 1 : 0 }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        injectedJavaScript={injectedJavaScript}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { type: string; step?: string };
            if (data.type === "leave") onLeave();
            if (data.type === "chat-status") setWebReady(data.step === "chatting");
          } catch {}
        }}
        onNavigationStateChange={(state) => {
          if (state.url && !state.url.includes("/chatroom/")) onLeave();
        }}
      />
      {!webReady && (
        <View style={LS.overlay}>
          <View style={LS.card}>
            <View style={LS.cardOrb} />
            <View style={LS.iconWrap}>
              <ActivityIndicator color="#f59e0b" size="small" />
            </View>
            <View style={LS.textBlock}>
              <Text style={LS.title}>Preparing room</Text>
              <Text style={LS.sub}>Connecting to session…</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0d0d0d" },
  scroll: { flex: 1, backgroundColor: "#0d0d0d" },

  // ── Hub
  hubContent: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
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
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(245,158,11,0.07)",
    top: -80,
    right: -70,
  },
  heroTopBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#f59e0b" },
  brandText: { color: "#f59e0b", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  heroPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroPillText: { color: "#555", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { color: "#ededed", fontSize: 38, fontWeight: "800", lineHeight: 44, letterSpacing: -0.8, marginTop: 4 },
  heroSubtitle: { color: "#5c5c5c", fontSize: 14, lineHeight: 21 },

  // ── Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginTop: 4 },
  sectionTitle: { color: "#ededed", fontSize: 17, fontWeight: "800" },
  sectionMeta: { color: "#444", fontSize: 12, fontWeight: "700" },

  // ── Mode cards
  modeCard: { borderRadius: 22, backgroundColor: "#111111", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  modeCardPressed: { opacity: 0.78, transform: [{ scale: 0.984 }] },
  modeCardInner: { padding: 20, gap: 14 },
  modeCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modeIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", alignItems: "center", justifyContent: "center" },
  modeBadge: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  modeBadgeText: { color: "#555", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  modeCardBody: { gap: 5 },
  modeTitle: { color: "#ededed", fontSize: 19, fontWeight: "700" },
  modeDesc: { color: "#5a5a5a", fontSize: 13, lineHeight: 19 },
  modeFooter: { flexDirection: "row", alignItems: "center", gap: 5 },
  modeCtaText: { color: "#555", fontSize: 13, fontWeight: "600" },

  // ── SubShell
  subContent: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  subHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  backBtnPlaceholder: { width: 38 },
  subTitle: { fontSize: 16, fontWeight: "700", color: "#ededed", letterSpacing: -0.2 },

  // ── Section card
  section: { borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#111111", padding: 20, gap: 14 },
  sectionTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 11, fontWeight: "700", color: "#555", textTransform: "uppercase", letterSpacing: 0.9 },

  // ── Inputs
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#555" },
  inputLabelMuted: { color: "#383838" },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.04)", overflow: "hidden" },
  textInput: { flex: 1, color: "#ededed", fontSize: 15, fontWeight: "500", paddingHorizontal: 16, paddingVertical: 14 },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  codeInput: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: "#ededed", fontSize: 20, fontWeight: "800", letterSpacing: 3 },

  // ── Info banner
  infoBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, backgroundColor: "rgba(245,158,11,0.06)", borderWidth: 1, borderColor: "rgba(245,158,11,0.14)", padding: 12 },
  infoBannerText: { flex: 1, color: "#a07030", fontSize: 12, lineHeight: 18 },

  hint: { fontSize: 12, color: "#4a4a4a", lineHeight: 18 },

  // ── Buttons
  mainBtn: { backgroundColor: "#3ecf8e", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  mainBtnDisabled: { opacity: 0.4 },
  mainBtnText: { fontSize: 15, fontWeight: "700", color: "#08110d" },
});

const LS = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 36,
    paddingVertical: 32,
    borderRadius: 28,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    minWidth: 220,
  },
  cardOrb: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(245,158,11,0.07)",
    top: -60,
    right: -50,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    color: "#ededed",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sub: {
    color: "#444",
    fontSize: 12,
    fontWeight: "500",
  },
});
