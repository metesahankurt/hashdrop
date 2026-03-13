import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useUsernameStore } from "@/store/use-username-store";
import { Button } from "./Button";
import { Input } from "./Input";
import { User } from "lucide-react-native";

interface UsernameGateProps {
  children: React.ReactNode;
}

export function UsernameGate({ children }: UsernameGateProps) {
  const { username, setUsername } = useUsernameStore();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  if (username) {
    return <>{children}</>;
  }

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Please enter a username");
      return;
    }
    if (trimmed.length < 2) {
      setError("Username must be at least 2 characters");
      return;
    }
    if (trimmed.length > 32) {
      setError("Username must be 32 characters or less");
      return;
    }
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(trimmed)) {
      setError("Username can only contain letters, numbers, spaces, and _ - .");
      return;
    }
    setUsername(trimmed);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <User size={32} color="#3ecf8e" />
          </View>

          <Text style={styles.title}>Choose a username</Text>
          <Text style={styles.subtitle}>
            This name will be visible to others during file transfers and calls.
          </Text>

          <Input
            placeholder="e.g. Alex, CoolUser, Jane_42"
            value={inputValue}
            onChangeText={(t) => {
              setInputValue(t);
              setError("");
            }}
            error={error}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={32}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />

          <Button
            onPress={handleSubmit}
            disabled={!inputValue.trim()}
            style={styles.button}
          >
            Continue
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 28,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(62,207,142,0.1)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ededed",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#8b8b8b",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: 4,
  },
});
