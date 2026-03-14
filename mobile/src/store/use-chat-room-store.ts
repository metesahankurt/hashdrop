import { create } from "zustand";

export type ChatRoomStatus = "idle" | "connecting" | "connected" | "ended";

export interface ChatMessage {
  id: string;
  type: "text" | "system";
  sender: string;
  senderIdentity: string;
  content: string;
  timestamp: number;
}

interface ChatRoomStore {
  roomName: string;
  token: string;
  identity: string;
  username: string;
  hasPassword: boolean;
  status: ChatRoomStatus;
  messages: ChatMessage[];
  unreadCount: number;

  setRoomInfo: (info: {
    roomName: string;
    token: string;
    identity: string;
    username: string;
    hasPassword?: boolean;
  }) => void;
  setStatus: (status: ChatRoomStatus) => void;
  addMessage: (msg: ChatMessage) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  reset: () => void;
}

const initial = {
  roomName: "",
  token: "",
  identity: "",
  username: "",
  hasPassword: false,
  status: "idle" as ChatRoomStatus,
  messages: [],
  unreadCount: 0,
};

export const useChatRoomStore = create<ChatRoomStore>((set) => ({
  ...initial,
  setRoomInfo: (info) => set(info),
  setStatus: (status) => set({ status }),
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg].slice(-500) })),
  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
  reset: () => set(initial),
}));
