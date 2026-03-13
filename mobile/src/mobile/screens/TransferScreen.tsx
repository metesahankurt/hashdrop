import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { generateSecureCode, isValidCode } from "@/mobile/lib/code-generator";

import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextField } from "../components/TextField";

export function TransferScreen() {
  const [generatedCode, setGeneratedCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const normalizedJoinCode = joinCode.toUpperCase();
  const joinCodeValid = !joinCode || isValidCode(normalizedJoinCode);

  return (
    <AppShell
      title="File Transfer"
      subtitle="Bu ekran webdeki transfer urununun native karsiligi olarak hazirlaniyor. Kod uretme, join etme ve text-share giris akislari native tarafta ayri bolumler halinde duruyor."
    >
      <Card
        title="Send"
        description="Tek kullanimlik transfer kodu olusturup aliciyla paylas."
      >
        <PrimaryButton onPress={() => setGeneratedCode(generateSecureCode())}>
          Yeni kod uret
        </PrimaryButton>
        {generatedCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Hazir kod</Text>
            <Text style={styles.codeValue}>{generatedCode}</Text>
          </View>
        ) : null}
      </Card>

      <Card
        title="Receive"
        description="Gondericiden aldigin kodla baglanti baslat."
      >
        <TextField
          autoCapitalize="characters"
          label="Transfer code"
          onChangeText={(value) => setJoinCode(value.toUpperCase())}
          placeholder="COSMIC-FALCON"
          value={normalizedJoinCode}
        />
        <PrimaryButton disabled={!normalizedJoinCode || !joinCodeValid} onPress={() => {}}>
          Koda hazirlan
        </PrimaryButton>
        {!joinCodeValid ? (
          <Text style={styles.error}>Kod formati `AAA-BBB` seklinde olmali.</Text>
        ) : null}
      </Card>

      <Card
        title="Text Share"
        description="Webdeki text-share ozelligi icin native giris bolumu."
      >
        <Text style={styles.note}>
          Sonraki baglama adiminda clipboard, qr ve dosya secme entegrasyonlari bu route icine native olarak eklenecek.
        </Text>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  codeBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.18)",
    backgroundColor: "rgba(62,207,142,0.08)",
    padding: 14,
    gap: 4,
  },
  codeLabel: {
    color: "#3ecf8e",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  codeValue: {
    color: "#ededed",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  error: {
    color: "#f87171",
    fontSize: 12,
  },
  note: {
    color: "#8b8b8b",
    fontSize: 13,
    lineHeight: 19,
  },
});
