import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { ArrowLeft, ScanLine, Download } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useWarpStore } from "@/store/use-warp-store";
import { codeToPeerId, isValidCode } from "@/lib/code-generator";
import { formatFileSize, getFileIcon } from "@/lib/file-utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import { QRScanner } from "./QRScanner";

const PEERJS_SERVER = "hashdrop.onrender.com";

interface ReceiveViewProps {
  onBack: () => void;
}

interface ReceivedFile {
  name: string;
  size: number;
  mimeType: string;
  data: ArrayBuffer;
}

export function ReceiveView({ onBack }: ReceiveViewProps) {
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const peerRef = useRef<any>(null);
  const {
    status,
    progress,
    setStatus,
    setProgress,
    addLog,
    reset,
    clientInputCode,
    setClientInputCode,
  } = useWarpStore();

  const connect = async (inputCode: string) => {
    const trimmed = inputCode.trim().toUpperCase();
    if (!isValidCode(trimmed)) {
      Toast.show({ type: "error", text1: "Invalid code format" });
      return;
    }

    reset();
    setStatus("connecting");
    addLog(`Connecting with code: ${trimmed}`, "info");

    try {
      const { Peer } = await import("react-native-webrtc");
      const myId = `receiver-${Date.now()}`;
      const peer = new (Peer as any)(myId, {
        host: PEERJS_SERVER,
        port: 443,
        path: "/peerjs",
        secure: true,
      });
      peerRef.current = peer;

      peer.on("open", () => {
        const peerId = codeToPeerId(trimmed);
        const conn = peer.connect(peerId, { reliable: true });

        conn.on("open", () => {
          addLog("Connected! Requesting files...", "success");
          setStatus("connected");
          conn.send({ type: "request" });
        });

        conn.on("data", (data: any) => {
          if (data.type === "file") {
            addLog(`Receiving: ${data.name}`, "info");
            setStatus("transferring");
            setReceivedFiles((prev) => [...prev, data]);
          } else if (data.type === "done") {
            setStatus("completed");
            setProgress(100);
            addLog("All files received!", "success");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            conn.send({ type: "ack" });
          }
        });

        conn.on("error", (err: any) => {
          addLog(`Connection error: ${err.message}`, "error");
          setStatus("error");
        });

        conn.on("close", () => {
          if (status !== "completed") {
            addLog("Connection closed.", "info");
            setStatus("idle");
          }
        });
      });

      peer.on("error", (err: any) => {
        addLog(`Peer error: ${err.message}`, "error");
        setStatus("error");
        Toast.show({ type: "error", text1: "Could not connect — check the code" });
      });
    } catch (err: any) {
      addLog(`Error: ${err.message}`, "error");
      setStatus("error");
    }
  };

  const saveFile = async (file: ReceivedFile) => {
    try {
      const uint8 = new Uint8Array(file.data);
      let base64 = "";
      for (let i = 0; i < uint8.length; i++) {
        base64 += String.fromCharCode(uint8[i]);
      }
      const b64 = btoa(base64);

      const uri = FileSystem.documentDirectory + file.name;
      await FileSystem.writeAsStringAsync(uri, b64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: file.mimeType });
      } else {
        Toast.show({ type: "success", text1: "File saved!", text2: file.name });
      }
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to save file" });
    }
  };

  const getStatusColor = () => {
    if (status === "completed") return "#3ecf8e";
    if (status === "error") return "#ef4444";
    if (status === "transferring" || status === "connecting") return "#818cf8";
    return "#8b8b8b";
  };

  if (showScanner) {
    return (
      <QRScanner
        onScan={(scannedCode) => {
          setShowScanner(false);
          setCode(scannedCode);
          connect(scannedCode);
        }}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color="#ededed" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive Files</Text>
        <View style={{ width: 36 }} />
      </View>

      {status !== "idle" && (
        <GlassCard style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {status === "connecting" && "Connecting..."}
              {status === "connected" && "Connected — receiving..."}
              {status === "transferring" && `Receiving files...`}
              {status === "completed" && "All files received!"}
              {status === "error" && "Connection failed"}
            </Text>
          </View>
        </GlassCard>
      )}

      <GlassCard style={{ gap: 12 }}>
        <Text style={styles.sectionLabel}>Enter Transfer Code</Text>
        <Input
          placeholder="COSMIC-FALCON"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Button
          onPress={() => connect(code)}
          disabled={!code.trim() || status === "connecting" || status === "transferring"}
          loading={status === "connecting"}
        >
          Connect
        </Button>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          variant="secondary"
          onPress={() => setShowScanner(true)}
        >
          <ScanLine size={16} color="#ededed" />
          Scan QR Code
        </Button>
      </GlassCard>

      {receivedFiles.length > 0 && (
        <GlassCard>
          <Text style={styles.sectionLabel}>Received Files</Text>
          <View style={{ gap: 8 }}>
            {receivedFiles.map((file, i) => (
              <TouchableOpacity
                key={i}
                style={styles.fileItem}
                onPress={() => saveFile(file)}
              >
                <Text style={styles.fileIcon}>{getFileIcon(file.mimeType)}</Text>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                </View>
                <Download size={16} color="#3ecf8e" />
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  content: { padding: 20, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#ededed" },
  statusCard: { gap: 8 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: "500" },
  sectionLabel: {
    fontSize: 12,
    color: "#8b8b8b",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  dividerText: { fontSize: 12, color: "#8b8b8b" },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 10,
  },
  fileIcon: { fontSize: 22 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: "500", color: "#ededed" },
  fileSize: { fontSize: 11, color: "#8b8b8b", marginTop: 2 },
});
