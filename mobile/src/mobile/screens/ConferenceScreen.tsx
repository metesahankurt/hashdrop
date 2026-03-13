import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { generateSecureCode, isValidCode } from "@/mobile/lib/code-generator";

import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextField } from "../components/TextField";

export function ConferenceScreen() {
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  return (
    <AppShell
      title="Conference"
      subtitle="LiveKit tabanli conference akisinin native kabugu hazir. Create/join akislari native oldu; media ve room engine bir sonraki baglama asamasi."
    >
      <Card
        title="Host a meeting"
        description="Toplanti kodu olusturup katilimcilari davet et."
      >
        <PrimaryButton onPress={() => setRoomCode(generateSecureCode())}>
          Toplanti kodu olustur
        </PrimaryButton>
        {roomCode ? (
          <View style={styles.roomBox}>
            <Text style={styles.roomLabel}>Meeting code</Text>
            <Text style={styles.roomValue}>{roomCode}</Text>
          </View>
        ) : null}
      </Card>

      <Card
        title="Join a meeting"
        description="Var olan conference odasina kod ile baglan."
      >
        <TextField
          autoCapitalize="characters"
          label="Meeting code"
          onChangeText={(value) => setJoinCode(value.toUpperCase())}
          placeholder="COSMIC-FALCON"
          value={joinCode}
        />
        <PrimaryButton disabled={!isValidCode(joinCode)} onPress={() => {}}>
          Katilima hazirlan
        </PrimaryButton>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  roomBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.18)",
    backgroundColor: "rgba(129,140,248,0.08)",
    padding: 14,
    gap: 4,
  },
  roomLabel: {
    color: "#a5b4fc",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  roomValue: {
    color: "#ededed",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
