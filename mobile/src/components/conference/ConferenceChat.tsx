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
} from "react-native";
import { useRoomContext } from "@livekit/react-native";
import { X, Send } from "lucide-react-native";
import { useConferenceStore } from "@/store/use-conference-store";

interface ConferenceChatProps {
  onClose: () => void;
}

export function ConferenceChat({ onClose }: ConferenceChatProps) {
  const { chatMessages, addChatMessage, identity, username } = useConferenceStore();
  const room = useRoomContext();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!message.trim() || !room) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "chat",
        content: message.trim(),
        sender: username,
        senderIdentity: identity,
        timestamp: Date.now(),
      })
    );

    room.localParticipant.publishData(data, { reliable: true });

    addChatMessage({
      id: Math.random().toString(36).slice(2),
      sender: username,
      senderIdentity: identity,
      content: message.trim(),
      timestamp: Date.now(),
      type: "text",
    });
    setMessage("");
  };

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatMessages.length]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={18} color="#8b8b8b" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => {
          const isMe = item.senderIdentity === identity;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              {!isMe && (
                <Text style={styles.sender}>{item.sender}</Text>
              )}
              <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
                {item.content}
              </Text>
              <Text style={[styles.time, isMe && styles.timeMe]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#ededed" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  messages: { flex: 1 },
  messagesContent: { padding: 12, gap: 8 },
  emptyText: {
    color: "#8b8b8b",
    textAlign: "center",
    fontSize: 13,
    marginTop: 40,
  },
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
  messageText: { fontSize: 14, color: "#ededed", lineHeight: 20 },
  messageTextMe: { color: "#d1fae5" },
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
  sendBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
