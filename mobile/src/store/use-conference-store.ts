import { create } from "zustand";

export type ConferenceStatus =
  | "idle"
  | "pre-join"
  | "connecting"
  | "waiting"
  | "in-room"
  | "ended"
  | "denied";

export type ConferenceRole = "host" | "participant";

export interface ChatMessage {
  id: string;
  sender: string;
  senderIdentity: string;
  content: string;
  timestamp: number;
  type: "text" | "file";
  fileName?: string;
  fileSize?: number;
}

export interface WaitingParticipant {
  identity: string;
  username: string;
  joinedAt: number;
}

interface ConferenceStore {
  // Room info
  roomName: string;
  token: string;
  identity: string;
  role: ConferenceRole;
  username: string;

  // Status
  status: ConferenceStatus;

  // Controls
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isSpeakerMuted: boolean;

  // Panels
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isInviteOpen: boolean;

  // Spotlight
  pinnedIdentity: string | null;

  // Timer
  callStartTime: number | null;

  // Waiting room
  waitingParticipants: WaitingParticipant[];

  // Chat
  chatMessages: ChatMessage[];
  unreadCount: number;

  // Actions
  setRoomInfo: (info: {
    roomName: string;
    token: string;
    identity: string;
    role: ConferenceRole;
    username: string;
  }) => void;
  setStatus: (status: ConferenceStatus) => void;
  setIsMicMuted: (muted: boolean) => void;
  setIsCameraOff: (off: boolean) => void;
  setIsScreenSharing: (sharing: boolean) => void;
  setIsSpeakerMuted: (muted: boolean) => void;
  setIsChatOpen: (open: boolean) => void;
  setIsParticipantsOpen: (open: boolean) => void;
  setIsInviteOpen: (open: boolean) => void;
  setPinnedIdentity: (id: string | null) => void;
  setCallStartTime: (time: number | null) => void;
  addWaitingParticipant: (p: WaitingParticipant) => void;
  removeWaitingParticipant: (identity: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  reset: () => void;
}

const initialState = {
  roomName: "",
  token: "",
  identity: "",
  role: "participant" as ConferenceRole,
  username: "",
  status: "idle" as ConferenceStatus,
  isMicMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  isSpeakerMuted: false,
  isChatOpen: false,
  isParticipantsOpen: false,
  isInviteOpen: false,
  pinnedIdentity: null,
  callStartTime: null,
  waitingParticipants: [],
  chatMessages: [],
  unreadCount: 0,
};

export const useConferenceStore = create<ConferenceStore>((set) => ({
  ...initialState,

  setRoomInfo: (info) => set(info),
  setStatus: (status) => set({ status }),
  setIsMicMuted: (muted) => set({ isMicMuted: muted }),
  setIsCameraOff: (off) => set({ isCameraOff: off }),
  setIsScreenSharing: (sharing) => set({ isScreenSharing: sharing }),
  setIsSpeakerMuted: (muted) => set({ isSpeakerMuted: muted }),
  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setIsParticipantsOpen: (open) => set({ isParticipantsOpen: open }),
  setIsInviteOpen: (open) => set({ isInviteOpen: open }),
  setPinnedIdentity: (id) => set({ pinnedIdentity: id }),
  setCallStartTime: (time) => set({ callStartTime: time }),

  addWaitingParticipant: (p) =>
    set((state) => ({
      waitingParticipants: [...state.waitingParticipants, p],
    })),
  removeWaitingParticipant: (identity) =>
    set((state) => ({
      waitingParticipants: state.waitingParticipants.filter(
        (p) => p.identity !== identity
      ),
    })),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    })),
  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),

  reset: () => set(initialState),
}));
