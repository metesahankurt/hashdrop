import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  ArrowDownToLine,
  ArrowRight,
  Copy,
  FileText,
  ScanLine,
  Send,
} from "lucide-react-native";

import { generateSecureCode, isValidCode } from "@/mobile/lib/code-generator";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextField } from "../components/TextField";

const SendIcon = Send as any;
const ReceiveIcon = ArrowDownToLine as any;
const TextIcon = FileText as any;
const CopyIcon = Copy as any;
const ScanIcon = ScanLine as any;
const ArrowRightIcon = ArrowRight as any;

export function TransferScreen() {
  const [generatedCode, setGeneratedCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const normalizedJoinCode = joinCode.toUpperCase();
  const joinCodeValid = !joinCode || isValidCode(normalizedJoinCode);

  return (
    <AppShell
      title="File Transfer"
      subtitle="Fast direct transfer with a cleaner native entry flow for sending, receiving, and quick text drops."
    >
      <View style={styles.heroCard}>
        <View style={styles.heroOrb} />
        <Text style={styles.heroKicker}>TRANSFER HUB</Text>
        <Text style={styles.heroTitle}>Share files at lightspeed.</Text>
        <Text style={styles.heroText}>
          Generate a one-time code, join an incoming transfer, or prepare a quick text share.
        </Text>
      </View>

      <Pressable style={styles.featureCard}>
        <View style={styles.featureTop}>
          <View style={[styles.iconWrap, styles.iconWrapGreen]}>
            <SendIcon size={20} stroke="#3ecf8e" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Text style={[styles.badgeText, styles.badgeTextGreen]}>SEND</Text>
          </View>
        </View>

        <Text style={styles.featureTitle}>Create a transfer code</Text>
        <Text style={styles.featureDescription}>
          Spin up a one-time code and hand it off to the receiving device.
        </Text>

        <PrimaryButton onPress={() => setGeneratedCode(generateSecureCode())}>
          Generate code
        </PrimaryButton>

        {generatedCode ? (
          <View style={styles.codeBox}>
            <View>
              <Text style={styles.codeLabel}>Active code</Text>
              <Text style={styles.codeValue}>{generatedCode}</Text>
            </View>
            <View style={styles.codeIcon}>
              <CopyIcon size={16} stroke="#0d0d0d" strokeWidth={2.2} />
            </View>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.featureCard}>
        <View style={styles.featureTop}>
          <View style={[styles.iconWrap, styles.iconWrapBlue]}>
            <ReceiveIcon size={20} stroke="#a5b4fc" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgeBlue]}>
            <Text style={[styles.badgeText, styles.badgeTextBlue]}>RECEIVE</Text>
          </View>
        </View>

        <Text style={styles.featureTitle}>Join with a code</Text>
        <Text style={styles.featureDescription}>
          Enter the sender&apos;s transfer code and prepare the device for intake.
        </Text>

        <TextField
          autoCapitalize="characters"
          label="Transfer code"
          onChangeText={(value) => setJoinCode(value.toUpperCase())}
          placeholder="COSMIC-FALCON"
          value={normalizedJoinCode}
        />

        {!joinCodeValid ? (
          <Text style={styles.error}>Use the format `WORD-WORD` in uppercase.</Text>
        ) : null}

        <View style={styles.receiveActions}>
          <PrimaryButton
            disabled={!normalizedJoinCode || !joinCodeValid}
            onPress={() => {}}
          >
            Prepare transfer
          </PrimaryButton>
          <View style={styles.inlineAction}>
            <ScanIcon size={15} stroke="#d4d4d4" strokeWidth={2.2} />
            <Text style={styles.inlineActionText}>QR next</Text>
          </View>
        </View>
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureTop}>
          <View style={[styles.iconWrap, styles.iconWrapAmber]}>
            <TextIcon size={20} stroke="#f59e0b" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgeAmber]}>
            <Text style={[styles.badgeText, styles.badgeTextAmber]}>TEXT</Text>
          </View>
        </View>

        <Text style={styles.featureTitle}>Quick text share</Text>
        <Text style={styles.featureDescription}>
          A lightweight lane for links, notes, and short payloads that should move instantly.
        </Text>

        <View style={styles.miniNote}>
          <Text style={styles.miniNoteText}>
            Clipboard, QR, and device file entry points will plug into this route next.
          </Text>
          <ArrowRightIcon size={15} stroke="#f59e0b" strokeWidth={2.2} />
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    overflow: "hidden",
    position: "relative",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#131313",
    padding: 20,
    gap: 10,
  },
  heroOrb: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(62,207,142,0.12)",
    right: -35,
    top: -60,
  },
  heroKicker: {
    color: "#3ecf8e",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: "#ededed",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
    maxWidth: "90%",
  },
  heroText: {
    color: "#8b8b8b",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: "92%",
  },
  featureCard: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 12,
  },
  featureTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapGreen: {
    backgroundColor: "rgba(62,207,142,0.1)",
    borderColor: "rgba(62,207,142,0.22)",
  },
  iconWrapBlue: {
    backgroundColor: "rgba(129,140,248,0.12)",
    borderColor: "rgba(129,140,248,0.24)",
  },
  iconWrapAmber: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.24)",
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeGreen: {
    backgroundColor: "rgba(62,207,142,0.12)",
    borderColor: "rgba(62,207,142,0.18)",
  },
  badgeBlue: {
    backgroundColor: "rgba(129,140,248,0.12)",
    borderColor: "rgba(129,140,248,0.18)",
  },
  badgeAmber: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.18)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  badgeTextGreen: {
    color: "#3ecf8e",
  },
  badgeTextBlue: {
    color: "#a5b4fc",
  },
  badgeTextAmber: {
    color: "#f59e0b",
  },
  featureTitle: {
    color: "#ededed",
    fontSize: 18,
    fontWeight: "700",
  },
  featureDescription: {
    color: "#8b8b8b",
    fontSize: 13,
    lineHeight: 19,
  },
  codeBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.18)",
    backgroundColor: "rgba(62,207,142,0.08)",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  codeLabel: {
    color: "#3ecf8e",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  codeValue: {
    color: "#ededed",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginTop: 4,
  },
  codeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#3ecf8e",
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: "#f87171",
    fontSize: 12,
  },
  receiveActions: {
    gap: 10,
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  inlineActionText: {
    color: "#d4d4d4",
    fontSize: 13,
    fontWeight: "600",
  },
  miniNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
  },
  miniNoteText: {
    flex: 1,
    color: "#b3b3b3",
    fontSize: 13,
    lineHeight: 18,
  },
});
