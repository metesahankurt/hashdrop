import { useLocalSearchParams } from "expo-router";

import { ConferenceScreen } from "@/mobile/screens/ConferenceScreen";
import { UsernameGate } from "@/mobile/components/UsernameGate";

export default function ConferenceRoute() {
  useLocalSearchParams<Record<string, string | string[]>>();

  return (
    <UsernameGate>
      <ConferenceScreen />
    </UsernameGate>
  );
}
