import { useCallback, useRef, useState } from "react";

import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
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

export interface ReceivedFile {
  name: string;
  size: number;
  mimeType: string;
  data: ArrayBuffer;
}

async function createPeer(peerId: string) {
  // react-native-webrtc must inject WebRTC globals before PeerJS is imported
  const { registerGlobals } = await import("react-native-webrtc");
  registerGlobals();
  const { default: Peer } = await import("peerjs");
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
    addLog,
    reset,
  } = useWarpStore();

  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);

  const cleanup = useCallback(() => {
    connRef.current?.close();
    peerRef.current?.destroy();
    peerRef.current = null;
    connRef.current = null;
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
      setStatus("error");
    }
  }, [cleanup, setDisplayCode, setCodeExpiry, setStatus, addLog]);

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
      setStatus("completed");
      setProgress(100);
      addLog("All files sent!", "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      try {
        const myId = `rcv-${Date.now()}`;
        const peer = await createPeer(myId);
        peerRef.current = peer;

        peer.on("open", () => {
          const peerId = codeToPeerId(trimmed);
          const conn = peer.connect(peerId, { reliable: true });

          conn.on("open", () => {
            addLog("Connected! Requesting files...", "success");
            setStatus("connected");
            conn.send({ type: "request" });
          });

          conn.on("data", (data: any) => {
            if (data.type === "file") {
              addLog(`Receiving: ${data.name}`, "info");
              setStatus("transferring");
              setReceivedFiles((prev) => [...prev, data as ReceivedFile]);
            } else if (data.type === "done") {
              setStatus("completed");
              setProgress(100);
              addLog("All files received!", "success");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              conn.send({ type: "ack" });
            }
          });

          conn.on("error", (err: any) => {
            addLog(`Connection error: ${err.message}`, "error");
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
    [cleanup, setStatus, setProgress, addLog],
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
    const uint8 = new Uint8Array(file.data);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    const b64 = btoa(binary);
    const uri = (FileSystem.documentDirectory ?? "") + file.name;
    await FileSystem.writeAsStringAsync(uri, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: file.mimeType });
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
  };
}
