import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import {
  AudioSession,
  LiveKitRoom,
  useLocalParticipant,
  useParticipants,
  VideoTrack,
  useRoomContext,
  useTracks,
} from "@livekit/react-native";
import {
  DisconnectReason,
  ParticipantEvent,
  RoomEvent,
  Track,
  type Participant,
  type RemoteParticipant,
} from "livekit-client";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Phone,
  MessageSquare,
  Users,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useConferenceStore } from "@/store/use-conference-store";
import { ConferenceChat } from "./ConferenceChat";
import { ConferenceParticipants } from "./ConferenceParticipants";
import { ConferenceWaiting } from "./ConferenceWaiting";

const FLOATING_DOCK_HEIGHT = 74;
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "https://hashdrop.metesahankurt.cloud";

interface ConferenceRoomProps {
  livekitUrl: string;
  onLeave: () => void;
}

function getParticipantName(participant?: {
  identity?: string;
  metadata?: string;
  name?: string;
}) {
  if (participant?.name) return participant.name;
  try {
    const metadata = JSON.parse(participant?.metadata || "{}") as {
      username?: string;
      role?: string;
    };
    return metadata.username || participant?.identity || "Participant";
  } catch {
    return participant?.identity || "Participant";
  }
}

export function ConferenceRoom({ livekitUrl, onLeave }: ConferenceRoomProps) {
  const { token, status } = useConferenceStore();

  useEffect(() => {
    AudioSession.startAudioSession();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  if (status === "ended" || status === "denied") {
    return (
      <SafeAreaView style={styles.endedScreen}>
        <View style={styles.endedCard}>
          <Text style={styles.endedTitle}>
            {status === "denied" ? "Entry denied" : "Meeting ended"}
          </Text>
          <Text style={styles.endedText}>
            {status === "denied"
              ? "The host did not admit you or removed you from the meeting."
              : "The conference connection has ended."}
          </Text>
          <TouchableOpacity style={styles.endedButton} onPress={onLeave}>
            <Text style={styles.endedButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.room}>
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        audio={false}
        video={false}
        connectOptions={{
          autoSubscribe: true,
          rtcConfig: { iceTransportPolicy: "relay" },
          peerConnectionTimeout: 30_000,
        }}
      >
        <RoomContent onLeave={onLeave} />
      </LiveKitRoom>
    </View>
  );
}

function RoomContent({ onLeave }: { onLeave: () => void }) {
  const {
    status,
    roomName,
    role,
    identity,
    username,
    isMicMuted,
    isCameraOff,
    isChatOpen,
    isParticipantsOpen,
    unreadCount,
    waitingParticipants,
    setIsMicMuted,
    setIsCameraOff,
    setIsChatOpen,
    setIsParticipantsOpen,
    setStatus,
    setCallStartTime,
    addWaitingParticipant,
    setWaitingParticipants,
    removeWaitingParticipant,
    addChatMessage,
    clearUnread,
  } = useConferenceStore();

  const insets = useSafeAreaInsets();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const participants = useParticipants();
  const cameraTracks = useTracks([Track.Source.Camera]);
  const dockClearance = Math.max(insets.bottom, 10) + FLOATING_DOCK_HEIGHT;
  const hostWaitingCount = waitingParticipants.length;
  const allParticipants = useMemo(() => {
    const items = new Map<
      string,
      {
        identity: string;
        name: string;
        isMicrophoneEnabled?: boolean;
        isCameraEnabled?: boolean;
      }
    >();

    if (localParticipant?.identity) {
      items.set(localParticipant.identity, {
        identity: localParticipant.identity,
        name: getParticipantName({ name: username, identity: localParticipant.identity }),
        isMicrophoneEnabled: !isMicMuted,
        isCameraEnabled: !isCameraOff,
      });
    }

    for (const participant of participants) {
      items.set(participant.identity, {
        identity: participant.identity,
        name: getParticipantName(participant),
        isMicrophoneEnabled: participant.isMicrophoneEnabled,
        isCameraEnabled: participant.isCameraEnabled,
      });
    }

    return Array.from(items.values());
  }, [localParticipant, participants, username, isMicMuted, isCameraOff]);

  useEffect(() => {
    if (!room || !localParticipant) return;

    const sendJoinRequest = async () => {
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({ type: "join-request", identity, username }),
        );
        await localParticipant.publishData(payload, { reliable: true });
      } catch (error) {
        console.error("[Conference][MOBILE] join-request error:", error);
      }
    };

    const handleConnected = async () => {
      if (role === "host") {
        setStatus("in-room");
        setCallStartTime(Date.now());
      } else {
        setStatus("waiting");
        setTimeout(() => {
          void sendJoinRequest();
        }, 500);
      }
    };

    const handleDisconnected = (reason?: DisconnectReason) => {
      if (
        reason === DisconnectReason.PARTICIPANT_REMOVED ||
        reason === DisconnectReason.ROOM_DELETED
      ) {
        setStatus("denied");
      } else if (reason !== DisconnectReason.CLIENT_INITIATED) {
        setStatus("ended");
      }
    };

    const handleParticipantConnected = (participant: RemoteParticipant) => {
      const participantName = getParticipantName(participant);
      let isWaiting = false;
      try {
        const metadata = JSON.parse(participant.metadata || "{}") as { role?: string };
        isWaiting = metadata.role === "waiting";
      } catch {
        isWaiting = false;
      }
      if (!isWaiting) {
        console.log("[Conference][MOBILE] participant joined:", participantName);
      }
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      removeWaitingParticipant(participant.identity);
      console.log(
        "[Conference][MOBILE] participant left:",
        getParticipantName(participant),
      );
    };

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
    ) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload)) as {
          type?: string;
          identity?: string;
          username?: string;
          content?: string;
          sender?: string;
          senderIdentity?: string;
          timestamp?: number;
        };

        if (data.type === "join-request" && role === "host" && data.identity) {
          addWaitingParticipant({
            identity: data.identity,
            username: data.username || "Anonymous",
            joinedAt: Date.now(),
          });
          return;
        }

        if (data.type === "chat" && data.content) {
          addChatMessage({
            id: `${data.timestamp || Date.now()}-${data.senderIdentity || "remote"}`,
            sender:
              data.sender ||
              getParticipantName(participant) ||
              data.username ||
              "Participant",
            senderIdentity: data.senderIdentity || participant?.identity || "remote",
            content: data.content,
            timestamp: data.timestamp || Date.now(),
            type: "text",
          });
        }
      } catch (error) {
        console.error("[Conference][MOBILE] DataReceived parse error:", error);
      }
    };

    const handlePermissionsChanged = async () => {
      const participant = localParticipant as Participant;
      if (participant.permissions?.canPublish && role !== "host") {
        setStatus("in-room");
        setCallStartTime(Date.now());
        console.log("[Conference][MOBILE] admitted to room");
      }
    };

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.DataReceived, handleDataReceived);
    localParticipant.on(ParticipantEvent.ParticipantPermissionsChanged, handlePermissionsChanged);

    if ((room as { state?: string }).state === "connected") {
      void handleConnected();
    }

    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.DataReceived, handleDataReceived);
      localParticipant.off(
        ParticipantEvent.ParticipantPermissionsChanged,
        handlePermissionsChanged,
      );
    };
  }, [
    room,
    localParticipant,
    role,
    identity,
    username,
    setStatus,
    setCallStartTime,
    addWaitingParticipant,
    setWaitingParticipants,
    removeWaitingParticipant,
    addChatMessage,
  ]);

  useEffect(() => {
    if (role !== "host" || !roomName) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/conference/waiting?roomName=${encodeURIComponent(roomName)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          participants?: Array<{ identity: string; username: string }>;
        };
        if (!cancelled) {
          setWaitingParticipants(
            (data.participants || []).map((participant) => ({
              ...participant,
              joinedAt: Date.now(),
            })),
          );
        }
      } catch {
        // Ignore transient polling errors.
      }
    };

    void poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [role, roomName, setWaitingParticipants]);

  const toggleMic = async () => {
    const nextMuted = !isMicMuted;
    await localParticipant.setMicrophoneEnabled(!nextMuted);
    setIsMicMuted(nextMuted);
  };

  const toggleCamera = async () => {
    const nextCameraOff = !isCameraOff;
    await localParticipant.setCameraEnabled(!nextCameraOff);
    setIsCameraOff(nextCameraOff);
  };

  const leaveRoom = () => {
    Alert.alert("Leave Meeting", "Are you sure you want to leave?", [
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
          participants={allParticipants}
          onClose={() => setIsParticipantsOpen(false)}
        />
      </SafeAreaView>
    );
  }

  if (status === "waiting") {
    return (
      <SafeAreaView style={styles.container}>
        <ConferenceWaiting onLeave={onLeave} />
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
          <Text style={styles.participantCount}>{allParticipants.length}</Text>
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

      {role === "host" && hostWaitingCount > 0 && (
        <View style={styles.waitingBanner}>
          <Text style={styles.waitingBannerText}>
            {hostWaitingCount} participant{hostWaitingCount > 1 ? "s" : ""} waiting
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.waitingList}>
            {waitingParticipants.map((participant) => (
              <View key={participant.identity} style={styles.waitingChip}>
                <Text style={styles.waitingChipName} numberOfLines={1}>
                  {participant.username}
                </Text>
                <TouchableOpacity
                  style={styles.waitingApprove}
                  onPress={async () => {
                    try {
                      const res = await fetch(`${API_BASE}/api/conference/admit`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          roomName,
                          participantIdentity: participant.identity,
                          username: participant.username,
                        }),
                      });
                      if (!res.ok) throw new Error("Failed to admit participant");
                      removeWaitingParticipant(participant.identity);
                      Toast.show({ type: "success", text1: `${participant.username} admitted` });
                    } catch (error: unknown) {
                      Toast.show({
                        type: "error",
                        text1: error instanceof Error ? error.message : "Admit failed",
                      });
                    }
                  }}
                >
                  <Text style={styles.waitingApproveText}>Admit</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: dockClearance }]}>
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
  endedScreen: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  endedCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  endedTitle: { color: "#ededed", fontSize: 20, fontWeight: "700" },
  endedText: { color: "#8b8b8b", fontSize: 14, lineHeight: 20 },
  endedButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(62,207,142,0.16)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  endedButtonText: { color: "#3ecf8e", fontSize: 14, fontWeight: "700" },
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
  waitingBanner: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 10,
  },
  waitingBannerText: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "700",
  },
  waitingList: {
    gap: 8,
  },
  waitingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
  },
  waitingChipName: {
    color: "#ededed",
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 120,
  },
  waitingApprove: {
    borderRadius: 999,
    backgroundColor: "#3ecf8e",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  waitingApproveText: {
    color: "#0d0d0d",
    fontSize: 11,
    fontWeight: "800",
  },
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
