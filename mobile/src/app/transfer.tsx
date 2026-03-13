import { useLocalSearchParams } from "expo-router";

import { UsernameGate } from "@/mobile/components/UsernameGate";
import { TransferScreen } from "@/mobile/screens/TransferScreen";

export default function TransferRoute() {
  useLocalSearchParams<Record<string, string | string[]>>();

  return (
    <UsernameGate>
      <TransferScreen />
    </UsernameGate>
  );
}
