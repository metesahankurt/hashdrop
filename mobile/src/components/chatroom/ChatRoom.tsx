import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import {
  LiveKitRoom,
  useRoomContext,
  useParticipants,
  useLocalParticipant,
} from "@livekit/react-native";
import { RoomEvent } from "livekit-client";
import { X, Send, Copy, Users, MessageSquare } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useChatRoomStore } from "@/store/use-chat-room-store";

const ACCENT = "#f59e0b";
const FLOATING_DOCK_HEIGHT = 74;
const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_URL || "https://hashdrop.metesahankurt.cloud";

interface ChatRoomProps {
  livekitUrl: string;
  onLeave: () => void;
}

export function ChatRoom({ livekitUrl, onLeave }: ChatRoomProps) {
  const { token, status } = useChatRoomStore();

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={token}
        connect={status !== "idle"}
        audio={false}
        video={false}
        onDisconnected={onLeave}
      >
        <ChatRoomContent onLeave={onLeave} />
      </LiveKitRoom>
    </View>
  );
}

function getUsername(participant: any): string {
  try {
    return JSON.parse(participant.metadata ?? "{}").username ?? participant.identity;
  } catch {
    return participant.identity;
  }
}

function ChatRoomContent({ onLeave }: { onLeave: () => void }) {
  const { roomName, identity, username, hasPassword, messages, addMessage, unreadCount, clearUnread } =
    useChatRoomStore();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const insets = useSafeAreaInsets();
  const dockClearance = Math.max(insets.bottom, 10) + FLOATING_DOCK_HEIGHT;
  const [message, setMessage] = useState("");
  const [showParticipants, setShowParticipants] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Listen for incoming messages
  useEffect(() => {
    if (!room) return;
    const handler = (payload: Uint8Array, participant: any) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data?.type !== "chat") return;
        addMessage({
          id: `msg-${data.timestamp}-${data.senderIdentity}`,
          type: "text",
          sender: data.sender,
          senderIdentity: data.senderIdentity,
          content: data.content,
          timestamp: data.timestamp,
        });
      } catch {
        // ignore malformed data
      }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room, addMessage]);

  // Participant join/leave system messages
  useEffect(() => {
    if (!room) return;
    const onJoin = (participant: any) => {
      const name = getUsername(participant);
      addMessage({
        id: `sys-join-${Date.now()}-${participant.identity}`,
        type: "system",
        sender: "system",
        senderIdentity: "system",
        content: `${name} joined the room.`,
        timestamp: Date.now(),
      });
    };
    const onLeaveP = (participant: any) => {
      const name = getUsername(participant);
      addMessage({
        id: `sys-leave-${Date.now()}-${participant.identity}`,
        type: "system",
        sender: "system",
        senderIdentity: "system",
        content: `${name} left the room.`,
        timestamp: Date.now(),
      });
    };
    room.on(RoomEvent.ParticipantConnected, onJoin);
    room.on(RoomEvent.ParticipantDisconnected, onLeaveP);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onJoin);
      room.off(RoomEvent.ParticipantDisconnected, onLeaveP);
    };
  }, [room, addMessage]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMessage = () => {
    if (!message.trim() || !room) return;
    const payload = {
      type: "chat",
      content: message.trim(),
      sender: username,
      senderIdentity: identity,
      timestamp: Date.now(),
    };
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    room.localParticipant.publishData(encoded, { reliable: true });
    addMessage({
      id: `msg-${payload.timestamp}-${identity}`,
      type: "text",
      sender: username,
      senderIdentity: identity,
      content: message.trim(),
      timestamp: payload.timestamp,
    });
    setMessage("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const copyInviteLink = async () => {
    const params = new URLSearchParams({ from: username });
    if (hasPassword) params.set("pwd", "1");
    const link = `${WEB_APP_URL}/chatroom/${roomName}?${params.toString()}`;
    await Clipboard.setStringAsync(link);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({ type: "success", text1: "Invite link copied!" });
  };

  const handleLeave = () => {
    Alert.alert("Leave Room", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          room?.disconnect();
          onLeave();
        },
      },
    ]);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  // useParticipants() may include local participant depending on version — filter it out
  const remoteParticipants = participants.filter((p) => p.identity !== identity);
  const allParticipants = [
    { identity, name: username, isMe: true },
    ...remoteParticipants.map((p) => ({
      identity: p.identity,
      name: getUsername(p),
      isMe: false,
    })),
  ];

  const renderMessage = ({ item }: { item: typeof messages[0] }) => {
    if (item.type === "system") {
      return (
        <View style={styles.systemMsg}>
          <Text style={styles.systemText}>{item.content}</Text>
        </View>
      );
    }
    const isMe = item.senderIdentity === identity;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {!isMe && <Text style={styles.sender}>{item.sender}</Text>}
        <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.content}</Text>
        <Text style={[styles.time, isMe && styles.timeMe]}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MessageSquare size={16} color={ACCENT} />
          </View>
          <View>
            <Text style={styles.roomCode}>{roomName}</Text>
            <Text style={styles.participantCount}>
              {allParticipants.length} participant{allParticipants.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={copyInviteLink} style={styles.iconBtn}>
            <Copy size={16} color="#8b8b8b" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowParticipants(!showParticipants);
              clearUnread();
            }}
            style={[styles.iconBtn, showParticipants && styles.iconBtnActive]}
          >
            <Users size={16} color={showParticipants ? ACCENT : "#8b8b8b"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLeave} style={styles.iconBtn}>
            <X size={16} color="#8b8b8b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Participants panel */}
      {showParticipants && (
        <View style={styles.participantsPanel}>
          <Text style={styles.participantsLabel}>PARTICIPANTS</Text>
          <View style={styles.participantsList}>
            {allParticipants.map((p) => (
              <View key={p.identity} style={styles.participantItem}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.avatarText}>{p.name[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.participantName}>{p.name}</Text>
                {p.isMe && (
                  <View style={styles.meTag}>
                    <Text style={styles.meTagText}>you</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={dockClearance}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MessageSquare size={28} color={ACCENT} />
              </View>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>Be the first to say something.</Text>
            </View>
          }
        />

        {/* Input */}
        <View style={[styles.inputRow, { paddingBottom: dockClearance }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor="#525252"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            disabled={!message.trim()}
          >
            <Send size={17} color={message.trim() ? "#0d0d0d" : "#525252"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  roomCode: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ededed",
    letterSpacing: 0.3,
  },
  participantCount: {
    fontSize: 11,
    color: "#525252",
    marginTop: 1,
    fontWeight: "600",
  },
  headerActions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnActive: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.2)",
  },

  participantsPanel: {
    backgroundColor: "#111111",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  participantsLabel: {
    color: "#525252",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  participantsList: { gap: 8 },
  participantItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  participantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "800", color: ACCENT },
  participantName: {
    fontSize: 13,
    color: "#ededed",
    fontWeight: "600",
    flex: 1,
  },
  meTag: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  meTagText: { fontSize: 10, color: "#8b8b8b", fontWeight: "700" },

  messages: { flex: 1 },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#ededed" },
  emptyText: { fontSize: 13, color: "#525252" },

  systemMsg: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginVertical: 2,
  },
  systemText: { fontSize: 11, color: "#525252", fontWeight: "600" },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 10, gap: 2 },
  bubbleMe: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderBottomLeftRadius: 4,
  },
  sender: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: "700",
    marginBottom: 2,
  },
  msgText: { fontSize: 14, color: "#ededed", lineHeight: 20 },
  msgTextMe: { color: "#fef3c7" },
  time: { fontSize: 10, color: "#525252", alignSelf: "flex-end", marginTop: 2 },
  timeMe: { color: "rgba(254,243,199,0.4)" },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: "#ededed",
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
});
