import { useLocalSearchParams } from "expo-router";

import { UsernameGate } from "@/mobile/components/UsernameGate";
import { MainPagerScreen } from "@/mobile/navigation/MainPagerScreen";

export default function ConferenceRoute() {
  useLocalSearchParams<Record<string, string | string[]>>();

  return (
    <UsernameGate>
      <MainPagerScreen route="/conference" />
    </UsernameGate>
  );
}
