import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { generateSecureCode, isValidCode } from "@/mobile/lib/code-generator";

import { AppShell } from "../components/AppShell";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextField } from "../components/TextField";

export function ChatRoomScreen() {
  const [createdCode, setCreatedCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  return (
    <AppShell
      title="Chat Room"
      subtitle="Webdeki create/join room mantigi native route olarak ayrildi. Buraya native peer baglantisi ve mesaj listesi baglanacak."
    >
      <Card
        title="Create Room"
        description="Yeni oda kodu olustur ve katilimcilara dagit."
      >
        <PrimaryButton onPress={() => setCreatedCode(generateSecureCode())}>
          Oda kodu olustur
        </PrimaryButton>
        {createdCode ? <Text style={styles.code}>{createdCode}</Text> : null}
      </Card>

      <Card
        title="Join Room"
        description="Var olan bir odaya kod ile katil."
      >
        <TextField
          autoCapitalize="characters"
          label="Room code"
          onChangeText={(value) => setJoinCode(value.toUpperCase())}
          placeholder="COSMIC-FALCON"
          value={joinCode}
        />
        <PrimaryButton disabled={!isValidCode(joinCode)} onPress={() => {}}>
          Odaya hazirlan
        </PrimaryButton>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  code: {
    color: "#ededed",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
