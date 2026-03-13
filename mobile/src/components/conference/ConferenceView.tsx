import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Video, Plus, LogIn } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useConferenceStore } from "@/store/use-conference-store";
import { useUsernameStore } from "@/store/use-username-store";
import { generateSecureCode } from "@/lib/code-generator";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConferenceRoom } from "./ConferenceRoom";

// You need to set your LiveKit URL here or from env
const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || "wss://your-project.livekit.cloud";
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://your-hashdrop-domain.com";

export function ConferenceView() {
  const { username } = useUsernameStore();
  const { status, setRoomInfo, setStatus, reset } = useConferenceStore();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    setLoading(true);
    try {
      const roomName = generateSecureCode();
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
      setStatus("in-room");
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
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/conference/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: code, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join room");

      setRoomInfo({
        roomName: data.roomName,
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
    return <ConferenceRoom livekitUrl={LIVEKIT_URL} onLeave={() => { reset(); }} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Video Conference</Text>
      <Text style={styles.subtitle}>
        Encrypted video calls with up to 50 participants — powered by LiveKit.
      </Text>

      {/* Create Room */}
      <GlassCard style={{ gap: 12 }}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBg, { backgroundColor: "rgba(62,207,142,0.12)" }]}>
            <Plus size={22} color="#3ecf8e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>New Meeting</Text>
            <Text style={styles.cardDesc}>Start a meeting as host</Text>
          </View>
        </View>
        <Button onPress={createRoom} loading={loading}>
          Start Meeting
        </Button>
      </GlassCard>

      {/* Join Room */}
      <GlassCard style={{ gap: 12 }}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBg, { backgroundColor: "rgba(129,140,248,0.12)" }]}>
            <LogIn size={22} color="#818cf8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Join Meeting</Text>
            <Text style={styles.cardDesc}>Enter a room code to join</Text>
          </View>
        </View>
        <Input
          placeholder="COSMIC-FALCON"
          value={joinCode}
          onChangeText={(t) => setJoinCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Button
          variant="secondary"
          onPress={joinRoom}
          loading={loading}
          disabled={!joinCode.trim()}
        >
          Join
        </Button>
      </GlassCard>

      <GlassCard>
        <Text style={styles.featureTitle}>Features</Text>
        <View style={styles.features}>
          {[
            "Up to 50 participants",
            "End-to-end encrypted",
            "Screen sharing",
            "In-call chat",
            "Waiting room",
            "Host controls",
          ].map((f) => (
            <View key={f} style={styles.featureItem}>
              <Text style={styles.featureDot}>•</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: "700", color: "#ededed", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#8b8b8b", lineHeight: 20, marginBottom: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBg: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#ededed" },
  cardDesc: { fontSize: 12, color: "#8b8b8b", marginTop: 2 },
  featureTitle: { fontSize: 13, fontWeight: "600", color: "#8b8b8b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  features: { gap: 6 },
  featureItem: { flexDirection: "row", gap: 8, alignItems: "center" },
  featureDot: { color: "#3ecf8e", fontSize: 16 },
  featureText: { fontSize: 13, color: "#ededed" },
});
