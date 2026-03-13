import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MessageSquare, Plus, LogIn, Lock } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useChatRoomStore } from "@/store/use-chat-room-store";
import { useUsernameStore } from "@/store/use-username-store";
import { generateSecureCode, codeToPeerId, isValidCode } from "@/lib/code-generator";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChatRoom } from "./ChatRoom";

type SetupMode = "select" | "create" | "join";

export function ChatRoomView() {
  const { username } = useUsernameStore();
  const { status, roomCode, setRoomCode, setStatus, setMyPeerId, addMessage, addParticipant, reset } = useChatRoomStore();
  const [mode, setMode] = useState<SetupMode>("select");
  const [joinCode, setJoinCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (status === "connected") {
    return <ChatRoom onLeave={() => { reset(); setMode("select"); }} />;
  }

  const handleCreate = async () => {
    setLoading(true);
    const code = generateSecureCode();
    setRoomCode(code);

    try {
      const { Peer } = await import("react-native-webrtc");
      const peerId = codeToPeerId(code);
      const peer = new (Peer as any)(peerId, {
        host: "hashdrop.onrender.com",
        port: 443,
        path: "/",
        secure: true,
      });

      peer.on("open", (id: string) => {
        setMyPeerId(id);
        setStatus("connected");
        addParticipant({ peerId: id, username, joinedAt: Date.now() });
        addMessage({
          id: Date.now().toString(),
          type: "system",
          senderId: "system",
          senderName: "System",
          content: `Room ${code} created. Share this code to invite others.`,
          timestamp: Date.now(),
        });
        setLoading(false);
      });

      peer.on("connection", (conn: any) => {
        conn.on("open", () => {
          conn.on("data", (data: any) => {
            if (data.type === "join") {
              addParticipant({ peerId: conn.peer, username: data.username, joinedAt: Date.now() });
              addMessage({
                id: Date.now().toString(),
                type: "system",
                senderId: "system",
                senderName: "System",
                content: `${data.username} joined the room.`,
                timestamp: Date.now(),
              });
            } else if (data.type === "message") {
              addMessage({
                id: data.id,
                type: "text",
                senderId: conn.peer,
                senderName: data.username,
                content: data.content,
                timestamp: data.timestamp,
              });
            }
          });

          conn.on("close", () => {
            addMessage({
              id: Date.now().toString(),
              type: "system",
              senderId: "system",
              senderName: "System",
              content: "A participant left the room.",
              timestamp: Date.now(),
            });
          });
        });
      });

      peer.on("error", (err: any) => {
        Toast.show({ type: "error", text1: "Failed to create room" });
        setLoading(false);
        reset();
      });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!isValidCode(code)) {
      Toast.show({ type: "error", text1: "Invalid room code" });
      return;
    }
    setLoading(true);
    setRoomCode(code);

    try {
      const { Peer } = await import("react-native-webrtc");
      const myId = `guest-${Date.now()}`;
      const peer = new (Peer as any)(myId, {
        host: "hashdrop.onrender.com",
        port: 443,
        path: "/",
        secure: true,
      });

      peer.on("open", (id: string) => {
        setMyPeerId(id);
        const hostPeerId = codeToPeerId(code);
        const conn = peer.connect(hostPeerId, { reliable: true });

        conn.on("open", () => {
          conn.send({ type: "join", username });
          addParticipant({ peerId: id, username, joinedAt: Date.now() });
          setStatus("connected");
          setLoading(false);

          conn.on("data", (data: any) => {
            if (data.type === "message") {
              addMessage({
                id: data.id,
                type: "text",
                senderId: conn.peer,
                senderName: data.username,
                content: data.content,
                timestamp: data.timestamp,
              });
            }
          });
        });

        conn.on("error", () => {
          Toast.show({ type: "error", text1: "Failed to connect — check the code" });
          setLoading(false);
          reset();
        });
      });

      peer.on("error", () => {
        Toast.show({ type: "error", text1: "Connection failed" });
        setLoading(false);
        reset();
      });
    } catch (err: any) {
      Toast.show({ type: "error", text1: err.message });
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Chat Room</Text>
      <Text style={styles.subtitle}>
        P2P encrypted group chat — up to 50 participants, no server storage.
      </Text>

      {mode === "select" && (
        <View style={styles.cards}>
          <TouchableOpacity style={styles.card} onPress={() => setMode("create")} activeOpacity={0.75}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(62,207,142,0.12)" }]}>
              <Plus size={28} color="#3ecf8e" />
            </View>
            <Text style={styles.cardTitle}>Create Room</Text>
            <Text style={styles.cardDesc}>Start a new encrypted chat room and share the code.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => setMode("join")} activeOpacity={0.75}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(129,140,248,0.12)" }]}>
              <LogIn size={28} color="#818cf8" />
            </View>
            <Text style={styles.cardTitle}>Join Room</Text>
            <Text style={styles.cardDesc}>Enter a room code to join an existing chat.</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === "create" && (
        <GlassCard style={{ gap: 12 }}>
          <Text style={styles.sectionLabel}>Create Chat Room</Text>
          <Text style={styles.desc}>An encrypted room will be created with a shareable code.</Text>
          <Button onPress={handleCreate} loading={loading}>
            Create Room
          </Button>
          <Button variant="ghost" onPress={() => setMode("select")}>
            Cancel
          </Button>
        </GlassCard>
      )}

      {mode === "join" && (
        <GlassCard style={{ gap: 12 }}>
          <Text style={styles.sectionLabel}>Join Chat Room</Text>
          <Input
            placeholder="COSMIC-FALCON"
            value={joinCode}
            onChangeText={(t) => setJoinCode(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            label="Room Code"
          />
          <Button onPress={handleJoin} loading={loading} disabled={!joinCode.trim()}>
            Join
          </Button>
          <Button variant="ghost" onPress={() => setMode("select")}>
            Cancel
          </Button>
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: "700", color: "#ededed", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#8b8b8b", lineHeight: 20, marginBottom: 8 },
  cards: { gap: 12 },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  iconBg: { width: 52, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#ededed" },
  cardDesc: { fontSize: 13, color: "#8b8b8b", lineHeight: 18 },
  sectionLabel: { fontSize: 16, fontWeight: "600", color: "#ededed" },
  desc: { fontSize: 13, color: "#8b8b8b" },
});
