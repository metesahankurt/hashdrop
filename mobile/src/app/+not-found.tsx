import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0d0d0d",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text style={{ color: "#ededed", fontSize: 18, fontWeight: "600" }}>
        Screen not found
      </Text>
      <Text
        style={{
          color: "rgba(237,237,237,0.6)",
          fontSize: 14,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Open one of the configured HashDrop routes from the home screen.
      </Text>
    </View>
  );
}
