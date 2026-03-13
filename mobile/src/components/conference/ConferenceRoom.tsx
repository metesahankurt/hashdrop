import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import {
  LiveKitRoom,
  useLocalParticipant,
  useParticipants,
  VideoTrack,
  AudioTrack,
  useRoomContext,
  useTracks,
} from "@livekit/react-native";
import { Track } from "livekit-client";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Phone,
  MessageSquare,
  Users,
} from "lucide-react-native";
import { useConferenceStore } from "@/store/use-conference-store";
import { ConferenceChat } from "./ConferenceChat";
import { ConferenceParticipants } from "./ConferenceParticipants";
import { ConferenceWaiting } from "./ConferenceWaiting";

interface ConferenceRoomProps {
  livekitUrl: string;
  onLeave: () => void;
}

export function ConferenceRoom({ livekitUrl, onLeave }: ConferenceRoomProps) {
  const { token, status } = useConferenceStore();

  if (status === "waiting") {
    return <ConferenceWaiting onLeave={onLeave} />;
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={token}
      connect={true}
      audio={true}
      video={true}
      onDisconnected={onLeave}
      style={styles.room}
    >
      <RoomContent onLeave={onLeave} />
    </LiveKitRoom>
  );
}

function RoomContent({ onLeave }: { onLeave: () => void }) {
  const {
    roomName,
    role,
    isMicMuted,
    isCameraOff,
    isChatOpen,
    isParticipantsOpen,
    unreadCount,
    setIsMicMuted,
    setIsCameraOff,
    setIsChatOpen,
    setIsParticipantsOpen,
    clearUnread,
  } = useConferenceStore();

  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const cameraTracks = useTracks([Track.Source.Camera]);
  const screenTracks = useTracks([Track.Source.ScreenShare]);
  const audioTracks = useTracks([Track.Source.Microphone]);

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(isMicMuted);
    setIsMicMuted(!isMicMuted);
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(isCameraOff);
    setIsCameraOff(!isCameraOff);
  };

  const leaveRoom = () => {
    Alert.alert("Leave Meeting", "Are you sure you want to leave?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          localParticipant.room?.disconnect();
          onLeave();
        },
      },
    ]);
  };

  if (isChatOpen) {
    return (
      <SafeAreaView style={styles.container}>
        <ConferenceChat onClose={() => setIsChatOpen(false)} />
      </SafeAreaView>
    );
  }

  if (isParticipantsOpen) {
    return (
      <SafeAreaView style={styles.container}>
        <ConferenceParticipants
          participants={participants}
          onClose={() => setIsParticipantsOpen(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Room info */}
      <View style={styles.topBar}>
        <Text style={styles.roomName}>{roomName}</Text>
        <View style={styles.participantBadge}>
          <Users size={12} color="#8b8b8b" />
          <Text style={styles.participantCount}>{participants.length}</Text>
        </View>
      </View>

      {/* Video grid */}
      <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
        {cameraTracks.map((track) => (
          <View key={track.participant.identity} style={styles.videoTile}>
            <VideoTrack trackRef={track} style={styles.video} />
            <View style={styles.nameTag}>
              <Text style={styles.nameText} numberOfLines={1}>
                {track.participant.name || track.participant.identity}
              </Text>
            </View>
          </View>
        ))}

        {cameraTracks.length === 0 && (
          <View style={styles.noVideo}>
            <Text style={styles.noVideoText}>Cameras are off</Text>
          </View>
        )}
      </ScrollView>

      {/* Audio tracks (invisible, just for playback) */}
      {audioTracks.map((track) => (
        <AudioTrack key={track.participant.identity} trackRef={track} />
      ))}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, isMicMuted && styles.controlBtnActive]}
          onPress={toggleMic}
        >
          {isMicMuted ? (
            <MicOff size={22} color="#ef4444" />
          ) : (
            <Mic size={22} color="#ededed" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
          onPress={toggleCamera}
        >
          {isCameraOff ? (
            <VideoOff size={22} color="#ef4444" />
          ) : (
            <VideoIcon size={22} color="#ededed" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => {
            setIsChatOpen(true);
            clearUnread();
          }}
        >
          <MessageSquare size={22} color="#ededed" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setIsParticipantsOpen(true)}
        >
          <Users size={22} color="#ededed" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaveBtn} onPress={leaveRoom}>
          <Phone size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  room: { flex: 1, backgroundColor: "#0d0d0d" },
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  roomName: { fontSize: 15, fontWeight: "600", color: "#ededed" },
  participantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  participantCount: { fontSize: 12, color: "#8b8b8b" },
  grid: { flex: 1 },
  gridContent: {
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  videoTile: {
    width: "48%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    position: "relative",
  },
  video: { flex: 1 },
  nameTag: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nameText: { fontSize: 11, color: "#ededed", fontWeight: "500" },
  noVideo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    width: "100%",
  },
  noVideoText: { color: "#8b8b8b", fontSize: 14 },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  controlBtnActive: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  leaveBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "135deg" }],
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#3ecf8e",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#0d0d0d" },
});
