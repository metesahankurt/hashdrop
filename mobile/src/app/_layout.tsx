import "react-native-gesture-handler";
import { registerGlobals } from "@livekit/react-native-webrtc";
import { Platform } from "react-native";

registerGlobals();

const navigatorTarget = globalThis.navigator as
  | (Navigator & { product?: string; userAgent?: string })
  | undefined;

if (navigatorTarget) {
  if (!navigatorTarget.product) {
    navigatorTarget.product = "ReactNative";
  }
  if (!navigatorTarget.userAgent) {
    navigatorTarget.userAgent = `HashDropMobile/${Platform.OS}`;
  }
}

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast, { type ToastConfig } from "react-native-toast-message";

import { FloatingDock } from "@/mobile/components/FloatingDock";
import { MainNavigationAnimationProvider } from "@/mobile/navigation/MainNavigationAnimationProvider";

const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <View
      style={{
        width: "92%",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "rgba(18,18,18,0.96)",
        borderWidth: 1,
        borderColor: "rgba(62,207,142,0.28)",
      }}
    >
      <Text style={{ color: "#ededed", fontSize: 14, fontWeight: "700" }}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={{ color: "#8b8b8b", fontSize: 12, marginTop: 4 }}>
          {text2}
        </Text>
      ) : null}
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View
      style={{
        width: "92%",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "rgba(18,18,18,0.96)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.28)",
      }}
    >
      <Text style={{ color: "#ededed", fontSize: 14, fontWeight: "700" }}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={{ color: "#8b8b8b", fontSize: 12, marginTop: 4 }}>
          {text2}
        </Text>
      ) : null}
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View
      style={{
        width: "92%",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "rgba(18,18,18,0.96)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
      }}
    >
      <Text style={{ color: "#ededed", fontSize: 14, fontWeight: "700" }}>
        {text1}
      </Text>
      {text2 ? (
        <Text style={{ color: "#8b8b8b", fontSize: 12, marginTop: 4 }}>
          {text2}
        </Text>
      ) : null}
    </View>
  ),
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MainNavigationAnimationProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0d0d0d" },
              animation: "fade",
            }}
          />
          <FloatingDock />
        </View>
        <Toast config={toastConfig} topOffset={64} />
      </MainNavigationAnimationProvider>
    </SafeAreaProvider>
  );
}
