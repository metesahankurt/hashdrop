import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { X, Send, Copy, Users } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useChatRoomStore } from "@/store/use-chat-room-store";
import { useUsernameStore } from "@/store/use-username-store";
import type { ChatMessage } from "@/store/use-chat-room-store";

interface ChatRoomProps {
  onLeave: () => void;
}

export function ChatRoom({ onLeave }: ChatRoomProps) {
  const { username } = useUsernameStore();
  const { messages, participants, roomCode, myPeerId } = useChatRoomStore();
  const [message, setMessage] = useState("");
  const [showParticipants, setShowParticipants] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleLeave = () => {
    Alert.alert("Leave Room", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: onLeave },
    ]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    // Messages are sent via PeerJS connections (handled in ChatRoomView)
    // Here we just add locally and broadcast
    const msg: ChatMessage = {
      id: Date.now().toString(),
      type: "text",
      senderId: myPeerId,
      senderName: username,
      content: message.trim(),
      timestamp: Date.now(),
    };
    const { addMessage } = useChatRoomStore.getState();
    addMessage(msg);
    setMessage("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const copyRoomCode = async () => {
    await Clipboard.setStringAsync(roomCode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({ type: "success", text1: "Room code copied!" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.type === "system") {
      return (
        <View style={styles.systemMsg}>
          <Text style={styles.systemText}>{item.content}</Text>
        </View>
      );
    }

    const isMe = item.senderId === myPeerId;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {!isMe && <Text style={styles.sender}>{item.senderName}</Text>}
        <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.content}</Text>
        <Text style={[styles.time, isMe && styles.timeMe]}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roomTitle}>{roomCode}</Text>
          <Text style={styles.participantCount}>
            {participants.size} participant{participants.size !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={copyRoomCode} style={styles.iconBtn}>
            <Copy size={18} color="#8b8b8b" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowParticipants(!showParticipants)}
            style={styles.iconBtn}
          >
            <Users size={18} color="#8b8b8b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLeave} style={styles.iconBtn}>
            <X size={18} color="#8b8b8b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Participants panel */}
      {showParticipants && (
        <View style={styles.participantsPanel}>
          {Array.from(participants.values()).map((p) => (
            <View key={p.peerId} style={styles.participantItem}>
              <View style={styles.participantAvatar}>
                <Text style={styles.avatarText}>{p.username[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.participantName}>{p.username}</Text>
              {p.peerId === myPeerId && (
                <Text style={styles.meTag}>You</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          renderItem={renderMessage}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages yet. Say something!</Text>
          }
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8b8b8b"
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
            <Send size={18} color={message.trim() ? "#0d0d0d" : "#8b8b8b"} />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  roomTitle: { fontSize: 15, fontWeight: "700", color: "#ededed" },
  participantCount: { fontSize: 11, color: "#8b8b8b", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  participantsPanel: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    padding: 12,
    gap: 8,
  },
  participantItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(62,207,142,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "700", color: "#3ecf8e" },
  participantName: { fontSize: 13, color: "#ededed", flex: 1 },
  meTag: {
    fontSize: 10,
    color: "#8b8b8b",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  messages: { flex: 1 },
  messagesContent: { padding: 12, gap: 6 },
  emptyText: { color: "#8b8b8b", textAlign: "center", fontSize: 13, marginTop: 40 },
  systemMsg: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginVertical: 4,
  },
  systemText: { fontSize: 11, color: "#8b8b8b", textAlign: "center" },
  bubble: {
    maxWidth: "80%",
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  bubbleMe: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(62,207,142,0.15)",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderBottomLeftRadius: 4,
  },
  sender: { fontSize: 11, color: "#3ecf8e", fontWeight: "600", marginBottom: 2 },
  msgText: { fontSize: 14, color: "#ededed", lineHeight: 20 },
  msgTextMe: { color: "#d1fae5" },
  time: { fontSize: 10, color: "#8b8b8b", alignSelf: "flex-end" },
  timeMe: { color: "rgba(209,250,229,0.5)" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#ededed",
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3ecf8e",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "rgba(255,255,255,0.08)" },
});
