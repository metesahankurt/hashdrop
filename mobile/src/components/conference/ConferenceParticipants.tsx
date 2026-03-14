import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RemoteParticipant, LocalParticipant } from "livekit-client";
import { X, Mic, MicOff, Video, VideoOff, Crown } from "lucide-react-native";
import { useConferenceStore } from "@/store/use-conference-store";

const FLOATING_DOCK_HEIGHT = 74;

interface ConferenceParticipantsProps {
  participants: (RemoteParticipant | LocalParticipant)[];
  onClose: () => void;
}

export function ConferenceParticipants({
  participants,
  onClose,
}: ConferenceParticipantsProps) {
  const { identity } = useConferenceStore();
  const insets = useSafeAreaInsets();
  const dockClearance = Math.max(insets.bottom, 10) + FLOATING_DOCK_HEIGHT;

  const getInitials = (name: string) => {
    return name
      .split(/[\s_-]/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Participants ({participants.length})
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={18} color="#8b8b8b" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={participants}
        keyExtractor={(p) => p.identity}
        contentContainerStyle={[styles.list, { paddingBottom: dockClearance }]}
        renderItem={({ item: participant }) => {
          const isMe = participant.identity === identity;
          const isMuted = !participant.isMicrophoneEnabled;
          const isCameraOff = !participant.isCameraEnabled;
          const displayName = participant.name || participant.identity;

          return (
            <View style={styles.item}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              </View>

              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {isMe && (
                    <Text style={styles.meBadge}>You</Text>
                  )}
                  {participant.identity.includes("host") && (
                    <Crown size={12} color="#f59e0b" />
                  )}
                </View>
              </View>

              <View style={styles.statusIcons}>
                {isMuted ? (
                  <MicOff size={14} color="#ef4444" />
                ) : (
                  <Mic size={14} color="#3ecf8e" />
                )}
                {isCameraOff ? (
                  <VideoOff size={14} color="#ef4444" />
                ) : (
                  <Video size={14} color="#3ecf8e" />
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
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
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#ededed" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: 12, gap: 4 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(62,207,142,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#3ecf8e" },
  info: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 14, fontWeight: "500", color: "#ededed", flex: 1 },
  meBadge: {
    fontSize: 10,
    color: "#8b8b8b",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusIcons: { flexDirection: "row", gap: 8 },
});
