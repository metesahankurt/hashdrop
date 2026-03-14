import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { FloatingDock } from "@/mobile/components/FloatingDock";
import { MainNavigationAnimationProvider } from "@/mobile/navigation/MainNavigationAnimationProvider";

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
        <Toast />
      </MainNavigationAnimationProvider>
    </SafeAreaProvider>
  );
}
