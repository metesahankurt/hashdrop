import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Upload, Download, FileText } from "lucide-react-native";
import { SendView } from "./SendView";
import { ReceiveView } from "./ReceiveView";
import { TextShareView } from "./TextShareView";

type Mode = "select" | "send" | "receive" | "text";

export function TransferView() {
  const [mode, setMode] = useState<Mode>("select");

  if (mode === "send") return <SendView onBack={() => setMode("select")} />;
  if (mode === "receive") return <ReceiveView onBack={() => setMode("select")} />;
  if (mode === "text") return <TextShareView onBack={() => setMode("select")} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>File Transfer</Text>
      <Text style={styles.subtitle}>
        P2P encrypted transfers — no cloud storage, no tracking.
      </Text>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => setMode("send")}
          activeOpacity={0.75}
        >
          <View style={[styles.iconBg, { backgroundColor: "rgba(62,207,142,0.12)" }]}>
            <Upload size={28} color="#3ecf8e" />
          </View>
          <Text style={styles.cardTitle}>Send Files</Text>
          <Text style={styles.cardDesc}>
            Share files to any device using a secure code or QR.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setMode("receive")}
          activeOpacity={0.75}
        >
          <View style={[styles.iconBg, { backgroundColor: "rgba(99,102,241,0.12)" }]}>
            <Download size={28} color="#818cf8" />
          </View>
          <Text style={styles.cardTitle}>Receive Files</Text>
          <Text style={styles.cardDesc}>
            Enter a code or scan QR to download shared files.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setMode("text")}
          activeOpacity={0.75}
        >
          <View style={[styles.iconBg, { backgroundColor: "rgba(249,115,22,0.12)" }]}>
            <FileText size={28} color="#fb923c" />
          </View>
          <Text style={styles.cardTitle}>Share Text</Text>
          <Text style={styles.cardDesc}>
            Instantly share text, links, or notes to another device.
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ededed",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#8b8b8b",
    lineHeight: 20,
    marginBottom: 8,
  },
  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ededed",
  },
  cardDesc: {
    fontSize: 13,
    color: "#8b8b8b",
    lineHeight: 18,
  },
});
