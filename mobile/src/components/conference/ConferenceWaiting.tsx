import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Clock, X } from "lucide-react-native";

interface ConferenceWaitingProps {
  onLeave: () => void;
}

export function ConferenceWaiting({ onLeave }: ConferenceWaitingProps) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Clock size={40} color="#f59e0b" />
        </View>

        <Text style={styles.title}>Waiting for host</Text>
        <Text style={styles.subtitle}>
          The host will admit you shortly{dots}
        </Text>

        <ActivityIndicator
          size="small"
          color="#3ecf8e"
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity style={styles.leaveBtn} onPress={onLeave}>
          <X size={16} color="#8b8b8b" />
          <Text style={styles.leaveText}>Leave</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 320,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(245,158,11,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#ededed" },
  subtitle: { fontSize: 14, color: "#8b8b8b", textAlign: "center" },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  leaveText: { fontSize: 13, color: "#8b8b8b" },
});
