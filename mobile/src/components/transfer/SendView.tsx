import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import { ArrowLeft, Copy, FileUp, X, CheckCircle } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useWarpStore } from "@/store/use-warp-store";
import { useUsernameStore } from "@/store/use-username-store";
import { generateSecureCode, codeToPeerId } from "@/lib/code-generator";
import { formatFileSize, getFileIcon } from "@/lib/file-utils";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

const PEERJS_SERVER = "hashdrop.onrender.com";
const CODE_EXPIRY_MS = 5 * 60 * 1000;

interface SendViewProps {
  onBack: () => void;
}

export function SendView({ onBack }: SendViewProps) {
  const { username } = useUsernameStore();
  const {
    files,
    displayCode,
    status,
    progress,
    transferSpeed,
    codeExpiry,
    setFiles,
    setDisplayCode,
    setCodeExpiry,
    setStatus,
    setProgress,
    addLog,
    reset,
  } = useWarpStore();

  const [timeLeft, setTimeLeft] = useState<string>("");
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initPeer();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!codeExpiry) return;
    const interval = setInterval(() => {
      const remaining = codeExpiry - Date.now();
      if (remaining <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        if (status === "waiting") {
          setStatus("idle");
          addLog("Code expired. Generate a new one.", "warning");
        }
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [codeExpiry]);

  const initPeer = async () => {
    try {
      const { Peer } = await import("react-native-webrtc");
      const code = generateSecureCode();
      const peerId = codeToPeerId(code);

      setDisplayCode(code);
      setCodeExpiry(Date.now() + CODE_EXPIRY_MS);
      setStatus("waiting");
      addLog(`Your code: ${code}`, "info");

      const peer = new (Peer as any)(peerId, {
        host: PEERJS_SERVER,
        port: 443,
        path: "/peerjs",
        secure: true,
      });

      peerRef.current = peer;

      peer.on("connection", (conn: any) => {
        connRef.current = conn;
        addLog("Receiver connected!", "success");
        setStatus("connected");

        conn.on("data", (data: any) => {
          handleIncomingData(data, conn);
        });

        conn.on("close", () => {
          addLog("Connection closed.", "info");
          setStatus("idle");
        });
      });

      peer.on("error", (err: any) => {
        addLog(`Error: ${err.message}`, "error");
        setStatus("error");
      });
    } catch (err: any) {
      addLog(`Failed to init peer: ${err.message}`, "error");
    }
  };

  const handleIncomingData = (data: any, conn: any) => {
    if (data.type === "request") {
      addLog("Receiver is requesting files...", "info");
      sendFiles(conn);
    } else if (data.type === "ack") {
      addLog("Transfer acknowledged!", "success");
      setStatus("completed");
    }
  };

  const sendFiles = async (conn: any) => {
    if (!files.length) return;
    setStatus("transferring");
    addLog(`Sending ${files.length} file(s)...`, "info");

    try {
      for (const file of files) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();

        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            conn.send({
              type: "file",
              name: file.name,
              size: file.size,
              mimeType: file.type,
              data: reader.result,
            });
            addLog(`Sent: ${file.name}`, "success");
            resolve();
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(blob);
        });
      }

      conn.send({ type: "done" });
      setStatus("completed");
      setProgress(100);
      addLog("All files sent successfully!", "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      addLog(`Send error: ${err.message}`, "error");
      setStatus("error");
    }
  };

  const cleanup = () => {
    timerRef.current && clearInterval(timerRef.current);
    connRef.current?.close();
    peerRef.current?.destroy();
    reset();
  };

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const picked = result.assets.map((a) => ({
          name: a.name,
          size: a.size || 0,
          type: a.mimeType || "application/octet-stream",
          uri: a.uri,
        }));
        setFiles(picked);
        addLog(`${picked.length} file(s) selected.`, "info");
      }
    } catch {
      Toast.show({ type: "error", text1: "Failed to pick files" });
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(displayCode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({ type: "success", text1: "Code copied!" });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getStatusColor = () => {
    if (status === "completed") return "#3ecf8e";
    if (status === "error") return "#ef4444";
    if (status === "transferring") return "#818cf8";
    return "#8b8b8b";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color="#ededed" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Files</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Status */}
      {status !== "idle" && (
        <GlassCard style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {status === "waiting" && "Waiting for receiver..."}
              {status === "connected" && "Receiver connected"}
              {status === "transferring" && `Transferring... ${Math.round(progress)}%`}
              {status === "completed" && "Transfer complete!"}
              {status === "error" && "Transfer failed"}
            </Text>
          </View>
          {status === "transferring" && (
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          )}
        </GlassCard>
      )}

      {/* QR Code & Code Display */}
      {displayCode ? (
        <GlassCard style={styles.codeCard}>
          <Text style={styles.sectionLabel}>Your Transfer Code</Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={displayCode}
              size={160}
              backgroundColor="transparent"
              color="#3ecf8e"
            />
          </View>

          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{displayCode}</Text>
            <TouchableOpacity onPress={copyCode} style={styles.copyBtn}>
              <Copy size={16} color="#3ecf8e" />
            </TouchableOpacity>
          </View>

          {timeLeft && (
            <Text style={styles.expiry}>
              ⏱ Expires in {timeLeft}
            </Text>
          )}
        </GlassCard>
      ) : null}

      {/* File picker */}
      <GlassCard>
        <Text style={styles.sectionLabel}>Files to Send</Text>

        <TouchableOpacity style={styles.dropzone} onPress={pickFiles}>
          <FileUp size={32} color="#8b8b8b" />
          <Text style={styles.dropzoneTitle}>Tap to select files</Text>
          <Text style={styles.dropzoneSubtitle}>Any file type, up to 10 GB</Text>
        </TouchableOpacity>

        {files.length > 0 && (
          <View style={styles.fileList}>
            {files.map((file, i) => (
              <View key={i} style={styles.fileItem}>
                <Text style={styles.fileIcon}>{getFileIcon(file.type)}</Text>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFile(i)}>
                  <X size={16} color="#8b8b8b" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      {status === "completed" && (
        <View style={styles.successRow}>
          <CheckCircle size={20} color="#3ecf8e" />
          <Text style={styles.successText}>Files delivered successfully!</Text>
        </View>
      )}

      {(status === "completed" || status === "error") && (
        <Button variant="secondary" onPress={() => { cleanup(); initPeer(); }}>
          Send Again
        </Button>
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
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#818cf8",
    borderRadius: 2,
  },
  codeCard: { gap: 12, alignItems: "center" },
  sectionLabel: { fontSize: 12, color: "#8b8b8b", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5, alignSelf: "flex-start" },
  qrContainer: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(62,207,142,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.2)",
  },
  codeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3ecf8e",
    letterSpacing: 1,
  },
  copyBtn: {
    padding: 4,
  },
  expiry: { fontSize: 12, color: "#8b8b8b" },
  dropzone: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  dropzoneTitle: { fontSize: 15, fontWeight: "600", color: "#ededed" },
  dropzoneSubtitle: { fontSize: 12, color: "#8b8b8b" },
  fileList: { gap: 8, marginTop: 8 },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 10,
    borderRadius: 8,
  },
  fileIcon: { fontSize: 20 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: "500", color: "#ededed" },
  fileSize: { fontSize: 11, color: "#8b8b8b" },
  successRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  successText: { fontSize: 14, color: "#3ecf8e", fontWeight: "500" },
});
