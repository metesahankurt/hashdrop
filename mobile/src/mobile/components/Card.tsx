import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface CardProps extends PropsWithChildren {
  title?: string;
  description?: string;
  onPress?: () => void;
}

export function Card({ children, title, description, onPress }: CardProps) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress} style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  title: {
    color: "#ededed",
    fontSize: 17,
    fontWeight: "700",
  },
  description: {
    color: "#8b8b8b",
    fontSize: 13,
    lineHeight: 19,
  },
});
