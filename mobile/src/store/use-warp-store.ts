import { create } from "zustand";

export type TransferStatus =
  | "idle"
  | "waiting"
  | "connecting"
  | "connected"
  | "transferring"
  | "completed"
  | "error"
  | "cancelled";

export type TransferMode = "send" | "receive" | "text";

export interface ConsoleLog {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: number;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  uri: string;
}

interface WarpStore {
  // Peer
  myId: string;
  isPeerReady: boolean;

  // Transfer state
  status: TransferStatus;
  mode: TransferMode;
  progress: number;
  error: string | null;

  // Files
  files: FileInfo[];
  textContent: string;

  // Transfer data
  fileHash: string | null;
  transferStartTime: number | null;
  transferSpeed: number;
  transferredBytes: number;

  // Code
  displayCode: string;
  clientInputCode: string;
  codeExpiry: number | null;

  // Logs
  consoleLogs: ConsoleLog[];

  // Actions
  setMyId: (id: string) => void;
  setIsPeerReady: (ready: boolean) => void;
  setStatus: (status: TransferStatus) => void;
  setMode: (mode: TransferMode) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setFiles: (files: FileInfo[]) => void;
  setTextContent: (text: string) => void;
  setDisplayCode: (code: string) => void;
  setClientInputCode: (code: string) => void;
  setCodeExpiry: (expiry: number | null) => void;
  setTransferStartTime: (time: number | null) => void;
  setTransferSpeed: (speed: number) => void;
  setTransferredBytes: (bytes: number) => void;
  setFileHash: (hash: string | null) => void;
  addLog: (message: string, type: ConsoleLog["type"]) => void;
  clearLogs: () => void;
  reset: () => void;
  fullReset: () => void;
}

const initialState = {
  myId: "",
  isPeerReady: false,
  status: "idle" as TransferStatus,
  mode: "send" as TransferMode,
  progress: 0,
  error: null,
  files: [],
  textContent: "",
  fileHash: null,
  transferStartTime: null,
  transferSpeed: 0,
  transferredBytes: 0,
  displayCode: "",
  clientInputCode: "",
  codeExpiry: null,
  consoleLogs: [],
};

export const useWarpStore = create<WarpStore>((set) => ({
  ...initialState,

  setMyId: (id) => set({ myId: id }),
  setIsPeerReady: (ready) => set({ isPeerReady: ready }),
  setStatus: (status) => set({ status }),
  setMode: (mode) => set({ mode }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setFiles: (files) => set({ files }),
  setTextContent: (text) => set({ textContent: text }),
  setDisplayCode: (code) => set({ displayCode: code }),
  setClientInputCode: (code) => set({ clientInputCode: code }),
  setCodeExpiry: (expiry) => set({ codeExpiry: expiry }),
  setTransferStartTime: (time) => set({ transferStartTime: time }),
  setTransferSpeed: (speed) => set({ transferSpeed: speed }),
  setTransferredBytes: (bytes) => set({ transferredBytes: bytes }),
  setFileHash: (hash) => set({ fileHash: hash }),

  addLog: (message, type) =>
    set((state) => ({
      consoleLogs: [
        ...state.consoleLogs,
        {
          id: Math.random().toString(36).slice(2),
          message,
          type,
          timestamp: Date.now(),
        },
      ].slice(-100),
    })),

  clearLogs: () => set({ consoleLogs: [] }),

  reset: () =>
    set({
      status: "idle",
      progress: 0,
      error: null,
      transferStartTime: null,
      transferSpeed: 0,
      transferredBytes: 0,
    }),

  fullReset: () => set(initialState),
}));
