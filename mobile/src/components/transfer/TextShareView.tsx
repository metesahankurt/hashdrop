import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import { ArrowLeft, Copy, Send } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { generateSecureCode, codeToPeerId } from "@/lib/code-generator";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

const PEERJS_SERVER = "hashdrop.onrender.com";

interface TextShareViewProps {
  onBack: () => void;
}

export function TextShareView({ onBack }: TextShareViewProps) {
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "waiting" | "sent" | "error">("idle");
  const peerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  const startSharing = async () => {
    if (!text.trim()) {
      Toast.show({ type: "error", text1: "Please enter some text" });
      return;
    }

    const generatedCode = generateSecureCode();
    setCode(generatedCode);
    setStatus("waiting");

    try {
      const { Peer } = await import("react-native-webrtc");
      const peerId = codeToPeerId(generatedCode);
      const peer = new (Peer as any)(peerId, {
        host: PEERJS_SERVER,
        port: 443,
        path: "/",
        secure: true,
      });
      peerRef.current = peer;

      peer.on("connection", (conn: any) => {
        conn.on("open", () => {
          conn.send({ type: "text", content: text.trim() });
          setStatus("sent");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Toast.show({ type: "success", text1: "Text sent!" });
        });
      });

      peer.on("error", () => {
        setStatus("error");
        Toast.show({ type: "error", text1: "Failed to share" });
      });
    } catch {
      setStatus("error");
    }
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({ type: "success", text1: "Code copied!" });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={20} color="#ededed" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Text</Text>
        <View style={{ width: 36 }} />
      </View>

      <GlassCard style={{ gap: 12 }}>
        <Text style={styles.label}>Your text or link</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Paste or type your text here..."
          placeholderTextColor="#8b8b8b"
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <Button onPress={startSharing} disabled={!text.trim() || status === "waiting"}>
          <Send size={16} color="#0d0d0d" />
          Share
        </Button>
      </GlassCard>

      {code ? (
        <GlassCard style={{ gap: 12, alignItems: "center" }}>
          <Text style={styles.label}>Transfer Code</Text>
          <QRCode
            value={code}
            size={160}
            backgroundColor="transparent"
            color="#3ecf8e"
          />
          <TouchableOpacity style={styles.codeRow} onPress={copyCode}>
            <Text style={styles.codeText}>{code}</Text>
            <Copy size={16} color="#3ecf8e" />
          </TouchableOpacity>
          <Text style={styles.hint}>
            {status === "waiting" ? "Waiting for receiver..." : "Text delivered!"}
          </Text>
        </GlassCard>
      ) : null}
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
  label: { fontSize: 12, color: "#8b8b8b", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
  textArea: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 12,
    color: "#ededed",
    fontSize: 15,
    minHeight: 120,
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
  codeText: { fontSize: 18, fontWeight: "700", color: "#3ecf8e", letterSpacing: 1 },
  hint: { fontSize: 13, color: "#8b8b8b" },
});
