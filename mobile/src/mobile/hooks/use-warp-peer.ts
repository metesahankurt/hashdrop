import { useCallback, useRef, useState } from "react";

import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";

import { useWarpStore } from "@/store/use-warp-store";
import {
  codeToPeerId,
  generateSecureCode,
  isValidCode,
} from "@/lib/code-generator";

const PEERJS_HOST = "hashdrop.onrender.com";
const CODE_EXPIRY_MS = 5 * 60 * 1000;

// Relay base URL — set EXPO_PUBLIC_WEB_URL in .env (e.g. http://192.168.1.x:3000)
// Falls back to the production deployment.
const RELAY_BASE =
  process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, "") ??
  "https://hashdrop.metesahankurt.cloud";
const FileSystem = require("expo-file-system/legacy") as any;

export interface ReceivedFile {
  name: string;
  size: number;
  mimeType: string;
  data: ArrayBuffer;
}

async function createPeer(peerId: string) {
  // react-native-webrtc must inject WebRTC globals before PeerJS is imported.
  // It requires a native module that is NOT available in Expo Go —
  // a custom dev build is needed: `npx expo run:ios` or `npx expo run:android`.
  try {
    const { registerGlobals } = require("react-native-webrtc");
    registerGlobals();
  } catch {
    throw new Error(
      "WebRTC is not available in Expo Go.\n\nRun a development build to use file transfer:\n  npx expo run:ios\n  npx expo run:android",
    );
  }
  const peerModule = require("peerjs");
  const Peer = peerModule.default ?? peerModule;
  return new (Peer as any)(peerId, {
    host: PEERJS_HOST,
    port: 443,
    path: "/",
    secure: true,
  });
}

export function useWarpPeer() {
  const {
    setDisplayCode,
    setCodeExpiry,
    setStatus,
    setProgress,
    setFiles,
    setError,
    addLog,
    reset,
  } = useWarpStore();

  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const relayPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);

  const cleanup = useCallback(() => {
    connRef.current?.close();
    peerRef.current?.destroy();
    peerRef.current = null;
    connRef.current = null;
    if (relayPollRef.current) {
      clearInterval(relayPollRef.current);
      relayPollRef.current = null;
    }
    setReceivedFiles([]);
    reset();
  }, [reset]);

  /** Sender side: auto-generates code, waits for receiver to connect */
  const initSender = useCallback(async () => {
    cleanup();
    try {
      const code = generateSecureCode();
      const peerId = codeToPeerId(code);

      setDisplayCode(code);
      setCodeExpiry(Date.now() + CODE_EXPIRY_MS);
      setStatus("waiting");
      addLog(`Your code: ${code}`, "info");

      const peer = await createPeer(peerId);
      peerRef.current = peer;

      peer.on("connection", (conn: any) => {
        connRef.current = conn;
        addLog("Receiver connected!", "success");
        setStatus("connected");

        conn.on("data", (data: any) => {
          if (data.type === "request") {
            addLog("Receiver is requesting files...", "info");
          } else if (data.type === "ack") {
            setStatus("completed");
            addLog("Transfer complete!", "success");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        });

        conn.on("close", () => {
          const s = useWarpStore.getState().status;
          if (s !== "completed") setStatus("idle");
          addLog("Connection closed.", "info");
        });
      });

      peer.on("error", (err: any) => {
        addLog(`Peer error: ${err.message}`, "error");
        setStatus("error");
      });
    } catch (err: any) {
      addLog(`Init failed: ${err.message}`, "error");
      setError(err.message);
      setStatus("error");
    }
  }, [cleanup, setDisplayCode, setCodeExpiry, setStatus, setError, addLog]);

  /** Send the currently selected files over the open connection */
  const sendFiles = useCallback(async () => {
    const { files: currentFiles } = useWarpStore.getState();
    const conn = connRef.current;
    if (!conn || !currentFiles.length) return;

    setStatus("transferring");
    addLog(`Sending ${currentFiles.length} file(s)...`, "info");

    try {
      for (const file of currentFiles) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();

        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            conn.send({
              type: "file",
              name: file.name,
              size: file.size,
              mimeType: file.type,
              data: reader.result,
            });
            addLog(`Sent: ${file.name}`, "success");
            resolve();
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(blob);
        });
      }

      conn.send({ type: "done" });
      setProgress(100);
      addLog("All files sent. Waiting for receiver confirmation...", "info");
    } catch (err: any) {
      addLog(`Send error: ${err.message}`, "error");
      setStatus("error");
    }
  }, [setStatus, setProgress, addLog]);

  /** Receiver side: connect to sender using a code */
  const connect = useCallback(
    async (inputCode: string) => {
      const trimmed = inputCode.trim().toUpperCase();
      if (!isValidCode(trimmed)) return;

      cleanup();
      setStatus("connecting");
      addLog(`Connecting with code: ${trimmed}`, "info");

      // 1. Check relay first — PC may have already uploaded files
      try {
        const res = await fetch(`${RELAY_BASE}/api/relay/${trimmed}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.files) && json.files.length > 0) {
            addLog(`Relay files found: ${json.files.length} file(s)`, "success");
            setStatus("transferring");
            const downloaded: ReceivedFile[] = [];
            for (const f of json.files) {
              const fileRes = await fetch(`${RELAY_BASE}/api/relay/${trimmed}?index=${f.index}`);
              const data = await fileRes.arrayBuffer();
              downloaded.push({ name: f.name, size: f.size, mimeType: f.mimeType, data });
              addLog(`Downloaded: ${f.name}`, "success");
            }
            setReceivedFiles(downloaded);
            setProgress(100);
            setStatus("completed");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addLog("All files received!", "success");
            return;
          }
        }
      } catch {
        // relay check failed — fall through
      }

      // 2. Claim the code so the PC sender knows to upload to relay
      try {
        await fetch(`${RELAY_BASE}/api/relay/${trimmed}/claim`, { method: "POST" });
        addLog("Notified sender — waiting for upload...", "info");
      } catch {
        // ignore
      }

      // 3. Poll relay for files uploaded by PC sender
      let relayFound = false;
      const pollInterval = setInterval(async () => {
        if (relayFound) { clearInterval(pollInterval); relayPollRef.current = null; return; }
        try {
          const res = await fetch(`${RELAY_BASE}/api/relay/${trimmed}`);
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.files) && json.files.length > 0) {
              relayFound = true;
              clearInterval(pollInterval);
              addLog(`Relay files found: ${json.files.length} file(s)`, "success");
              setStatus("transferring");
              const downloaded: ReceivedFile[] = [];
              for (const f of json.files) {
                const fileRes = await fetch(`${RELAY_BASE}/api/relay/${trimmed}?index=${f.index}`);
                const data = await fileRes.arrayBuffer();
                downloaded.push({ name: f.name, size: f.size, mimeType: f.mimeType, data });
                addLog(`Downloaded: ${f.name}`, "success");
              }
              setReceivedFiles(downloaded);
              setProgress(100);
              setStatus("completed");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              addLog("All files received!", "success");
            }
          }
        } catch {
          // ignore poll errors
        }
      }, 2000);
      relayPollRef.current = pollInterval;

      // Timeout — stop polling after 90s if nothing arrived
      setTimeout(() => {
        if (!relayFound) {
          clearInterval(pollInterval);
          relayPollRef.current = null;
          if (useWarpStore.getState().status === "connecting" || useWarpStore.getState().status === "transferring") {
            setStatus("error");
            setError("Connection timeout — no files received. Make sure the sender has the app open.");
            addLog("Relay timeout — no files received", "error");
          }
        }
      }, 90000);

      // 4. Also attempt PeerJS P2P (works in dev builds, not Expo Go)
      try {
        const myId = `rcv-${Date.now()}`;
        const peer = await createPeer(myId);
        peerRef.current = peer;

        peer.on("open", () => {
          if (relayFound) { peer.destroy(); return; }
          const peerId = codeToPeerId(trimmed);
          const conn = peer.connect(peerId, { reliable: true });

          conn.on("open", () => {
            if (relayFound) { conn.close(); return; }
            addLog("Connected! Requesting files...", "success");
            setStatus("connected");
            conn.send({ type: "request" });
          });

          conn.on("data", (data: any) => {
            if (relayFound) return;
            if (data.type === "file") {
              addLog(`Receiving: ${data.name}`, "info");
              setStatus("transferring");
              setReceivedFiles((prev) => [...prev, data as ReceivedFile]);
            } else if (data.type === "done") {
              clearInterval(pollInterval);
              setStatus("completed");
              setProgress(100);
              addLog("All files received!", "success");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              conn.send({ type: "ack" });
            }
          });

          conn.on("error", (err: any) => {
            if (!relayFound) addLog(`P2P error: ${err.message}`, "info");
          });
        });

        peer.on("error", (err: any) => {
          if (!relayFound) addLog(`P2P unavailable: ${err.message}`, "info");
        });
      } catch (err: any) {
        // WebRTC not available (Expo Go) — relay will handle it
        addLog(`P2P unavailable: ${err.message}`, "info");
      }
    },
    [cleanup, setStatus, setProgress, setError, addLog],
  );

  /** Text share — sender side */
  const initTextSender = useCallback(
    async (text: string) => {
      cleanup();
      try {
        const code = generateSecureCode();
        const peerId = codeToPeerId(code);

        setDisplayCode(code);
        setStatus("waiting");
        addLog(`Text share code: ${code}`, "info");

        const peer = await createPeer(peerId);
        peerRef.current = peer;

        peer.on("connection", (conn: any) => {
          conn.on("open", () => {
            conn.send({ type: "text", content: text.trim() });
            setStatus("completed");
            addLog("Text delivered!", "success");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          });
        });

        peer.on("error", (err: any) => {
          addLog(`Error: ${err.message}`, "error");
          setStatus("error");
        });
      } catch (err: any) {
        addLog(`Init failed: ${err.message}`, "error");
        setStatus("error");
      }
    },
    [cleanup, setDisplayCode, setStatus, addLog],
  );

  /** Text share — receiver side */
  const connectForText = useCallback(
    async (inputCode: string, onText: (text: string) => void) => {
      const trimmed = inputCode.trim().toUpperCase();
      if (!isValidCode(trimmed)) return;

      cleanup();
      setStatus("connecting");
      addLog(`Connecting: ${trimmed}`, "info");

      try {
        const myId = `rcv-txt-${Date.now()}`;
        const peer = await createPeer(myId);
        peerRef.current = peer;

        peer.on("open", () => {
          const peerId = codeToPeerId(trimmed);
          const conn = peer.connect(peerId, { reliable: true });

          conn.on("data", (data: any) => {
            if (data.type === "text") {
              onText(data.content);
              setStatus("completed");
              addLog("Text received!", "success");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          });

          conn.on("error", (err: any) => {
            addLog(`Error: ${err.message}`, "error");
            setStatus("error");
          });
        });

        peer.on("error", (err: any) => {
          addLog(`Peer error: ${err.message}`, "error");
          setStatus("error");
        });
      } catch (err: any) {
        addLog(`Error: ${err.message}`, "error");
        setStatus("error");
      }
    },
    [cleanup, setStatus, addLog],
  );

  const pickFiles = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const picked = result.assets.map((a: DocumentPicker.DocumentPickerAsset) => ({
        name: a.name,
        size: a.size ?? 0,
        type: a.mimeType ?? "application/octet-stream",
        uri: a.uri,
      }));
      setFiles(picked);
      addLog(`${picked.length} file(s) selected.`, "info");
    }
  }, [setFiles, addLog]);

  const saveFile = useCallback(async (file: ReceivedFile) => {
    try {
      const uint8 = new Uint8Array(file.data);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8.byteLength; i += chunkSize) {
        binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      const fileUri = (FileSystem.cacheDirectory ?? "") + file.name;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: file.mimeType });
      }
    } catch (err: any) {
      console.error("saveFile error:", err);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return {
    initSender,
    sendFiles,
    connect,
    initTextSender,
    connectForText,
    pickFiles,
    saveFile,
    copyToClipboard,
    cleanup,
    receivedFiles,

    // HTTP relay — works in Expo Go without WebRTC
    sendViaRelay,
    checkRelay,
  };
}

// ---------------------------------------------------------------------------
// Relay helpers (standalone, no hook context needed)
// ---------------------------------------------------------------------------

/** Upload selected files to the relay API. Returns the transfer code. */
export async function sendViaRelay(
  files: Array<{ name: string; size: number; type: string; uri: string }>,
  code: string,
  onProgress?: (sent: number, total: number) => void,
): Promise<void> {
  const url = `${RELAY_BASE}/api/relay/${code}`;
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    formData.append("file", {
      uri: f.uri,
      name: f.name,
      type: f.type || "application/octet-stream",
    } as unknown as Blob);
    onProgress?.(i + 1, files.length);
  }

  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Relay upload failed (${res.status}): ${body}`);
  }
}

/** Check if files are available on the relay for a given code. */
export async function checkRelay(
  code: string,
): Promise<Array<{ index: number; name: string; mimeType: string; size: number }> | null> {
  try {
    const res = await fetch(`${RELAY_BASE}/api/relay/${code.toUpperCase()}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.files ?? null;
  } catch {
    return null;
  }
}
