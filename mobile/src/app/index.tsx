import { useLocalSearchParams } from "expo-router";

import { UsernameGate } from "@/mobile/components/UsernameGate";
import { HomeScreen } from "@/mobile/screens/HomeScreen";

export default function HomeRoute() {
  useLocalSearchParams<Record<string, string | string[]>>();

  return (
    <UsernameGate>
      <HomeScreen />
    </UsernameGate>
  );
}
