import { useLocalSearchParams } from "expo-router";

import { ChatRoomScreen } from "@/mobile/screens/ChatRoomScreen";
import { UsernameGate } from "@/mobile/components/UsernameGate";

export default function ChatRoomRoute() {
  useLocalSearchParams<Record<string, string | string[]>>();

  return (
    <UsernameGate>
      <ChatRoomScreen />
    </UsernameGate>
  );
}
