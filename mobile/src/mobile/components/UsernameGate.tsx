import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";

import { useProfileStore } from "@/mobile/state/use-profile-store";

import { Card } from "./Card";
import { PrimaryButton } from "./PrimaryButton";
import { TextField } from "./TextField";

interface UsernameGateProps {
  children: React.ReactNode;
}

export function UsernameGate({ children }: UsernameGateProps) {
  const { username, setUsername } = useProfileStore();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  if (username) {
    return <>{children}</>;
  }

  const handleContinue = () => {
    const value = draft.trim();

    if (value.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }

    if (value.length > 24) {
      setError("Username must be 24 characters or fewer.");
      return;
    }

    setUsername(value);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Card
          title="Choose your name"
          description="This name will be visible to others across transfer, meetings, and chat."
        >
          <TextField
            label="Username"
            onChangeText={(value) => {
              setDraft(value);
              setError("");
            }}
            placeholder="e.g. mede, alex, jane"
            value={draft}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton disabled={!draft.trim()} onPress={handleContinue}>
            Continue
          </PrimaryButton>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  error: {
    color: "#f87171",
    fontSize: 12,
    marginTop: -4,
  },
});
