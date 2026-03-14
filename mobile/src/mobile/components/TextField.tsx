import type { ReturnKeyTypeOptions } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface TextFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: "none" | "characters" | "words" | "sentences";
  secureTextEntry?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
}

export function TextField({
  label,
  placeholder,
  value,
  onChangeText,
  autoCapitalize = "none",
  secureTextEntry = false,
  returnKeyType = "done",
  onSubmitEditing,
}: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6f6f6f"
        secureTextEntry={secureTextEntry}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: "#8b8b8b",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#ededed",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
});
