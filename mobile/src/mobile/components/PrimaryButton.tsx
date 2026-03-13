import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface PrimaryButtonProps extends PropsWithChildren {
  disabled?: boolean;
  onPress: () => void;
  tone?: "primary" | "secondary";
}

export function PrimaryButton({
  children,
  disabled,
  onPress,
  tone = "primary",
}: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        tone === "primary" ? styles.primary : styles.secondary,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === "primary" ? styles.primaryLabel : styles.secondaryLabel,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#3ecf8e",
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  primaryLabel: {
    color: "#0d0d0d",
  },
  secondaryLabel: {
    color: "#ededed",
  },
});
