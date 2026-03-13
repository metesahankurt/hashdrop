import { create } from "zustand";

export type ChatRoomStatus =
  | "idle"
  | "creating"
  | "joining"
  | "connected"
  | "disconnected"
  | "error";

export interface ChatMessage {
  id: string;
  type: "text" | "file" | "system";
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface Participant {
  peerId: string;
  username: string;
  joinedAt: number;
}

interface ChatRoomStore {
  roomCode: string;
  status: ChatRoomStatus;
  participants: Map<string, Participant>;
  messages: ChatMessage[];
  myPeerId: string;

  setRoomCode: (code: string) => void;
  setStatus: (status: ChatRoomStatus) => void;
  setMyPeerId: (id: string) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (peerId: string) => void;
  addMessage: (msg: ChatMessage) => void;
  reset: () => void;
}

export const useChatRoomStore = create<ChatRoomStore>((set) => ({
  roomCode: "",
  status: "idle",
  participants: new Map(),
  messages: [],
  myPeerId: "",

  setRoomCode: (code) => set({ roomCode: code }),
  setStatus: (status) => set({ status }),
  setMyPeerId: (id) => set({ myPeerId: id }),

  addParticipant: (p) =>
    set((state) => {
      const next = new Map(state.participants);
      next.set(p.peerId, p);
      return { participants: next };
    }),

  removeParticipant: (peerId) =>
    set((state) => {
      const next = new Map(state.participants);
      next.delete(peerId);
      return { participants: next };
    }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg].slice(-500),
    })),

  reset: () =>
    set({
      roomCode: "",
      status: "idle",
      participants: new Map(),
      messages: [],
      myPeerId: "",
    }),
}));
