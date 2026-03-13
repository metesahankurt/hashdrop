import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowDownToLine,
  ArrowLeft,
  CheckCircle,
  Copy,
  FileText,
  FileUp,
  ScanLine,
  Send,
  X,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";

import { useWarpStore } from "@/store/use-warp-store";
import { isValidCode } from "@/lib/code-generator";
import { formatFileSize, getFileIcon } from "@/lib/file-utils";
import {
  useWarpPeer,
  sendViaRelay,
  type ReceivedFile,
} from "@/mobile/hooks/use-warp-peer";
import { AppShell } from "@/mobile/components/AppShell";
import { PrimaryButton } from "@/mobile/components/PrimaryButton";
import { TextField } from "@/mobile/components/TextField";
import { QRScanner } from "@/mobile/components/QRScanner";

// Cast lucide icons to avoid TS strict type errors with react-native-svg
const SendIcon = Send as any;
const ReceiveIcon = ArrowDownToLine as any;
const TextIcon = FileText as any;
const CopyIcon = Copy as any;
const ScanIcon = ScanLine as any;
const BackIcon = ArrowLeft as any;
const FileUpIcon = FileUp as any;
const XIcon = X as any;
const CheckIcon = CheckCircle as any;

type TransferMode = "hub" | "send" | "receive" | "text";

// ---------------------------------------------------------------------------
// Hub screen
// ---------------------------------------------------------------------------
function TransferHub({ onSelect }: { onSelect: (m: TransferMode) => void }) {
  return (
    <AppShell
      title="File Transfer"
      subtitle="P2P encrypted transfers — no cloud, no tracking."
    >
      {/* Send */}
      <Pressable style={styles.card} onPress={() => onSelect("send")}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, styles.iconGreen]}>
            <SendIcon size={20} stroke="#3ecf8e" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Text style={[styles.badgeText, { color: "#3ecf8e" }]}>SEND</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>Send files</Text>
        <Text style={styles.cardDesc}>
          Generate a one-time code and share your files with any device.
        </Text>
      </Pressable>

      {/* Receive */}
      <Pressable style={styles.card} onPress={() => onSelect("receive")}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, styles.iconBlue]}>
            <ReceiveIcon size={20} stroke="#a5b4fc" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgeBlue]}>
            <Text style={[styles.badgeText, { color: "#a5b4fc" }]}>RECEIVE</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>Receive files</Text>
        <Text style={styles.cardDesc}>
          Enter the sender's code or scan a QR to download files instantly.
        </Text>
      </Pressable>

      {/* Text share */}
      <Pressable style={styles.card} onPress={() => onSelect("text")}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, styles.iconAmber]}>
            <TextIcon size={20} stroke="#f59e0b" strokeWidth={2.2} />
          </View>
          <View style={[styles.badge, styles.badgeAmber]}>
            <Text style={[styles.badgeText, { color: "#f59e0b" }]}>TEXT</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>Quick text share</Text>
        <Text style={styles.cardDesc}>
          Send a link, note, or snippet to another device over a secure channel.
        </Text>
      </Pressable>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Send screen
// ---------------------------------------------------------------------------
function TransferSendView({ onBack }: { onBack: () => void }) {
  const { files, displayCode, status, progress, codeExpiry, error, setStatus, setError, setDisplayCode, setCodeExpiry, addLog } = useWarpStore();
  const { initSender, sendFiles, pickFiles, copyToClipboard, cleanup } =
    useWarpPeer();

  const [timeLeft, setTimeLeft] = useState("");
  // "p2p" = WebRTC PeerJS, "relay" = HTTP relay (works in Expo Go)
  const [transport, setTransport] = useState<"p2p" | "relay" | "detecting">("detecting");
  const [relayCode, setRelayCodeLocal] = useState<string | null>(null);

  // Auto-init sender — if WebRTC fails (status becomes "error"), fall back to relay
  useEffect(() => {
    let cancelled = false;
    async function init() {
      await initSender();
      if (cancelled) return;

      // initSender catches errors internally; check resulting status
      const afterStatus = useWarpStore.getState().status;
      if (afterStatus === "error") {
        // WebRTC not available → relay mode
        const { generateSecureCode } = await import("@/lib/code-generator");
        const code = generateSecureCode();
        setDisplayCode(code);
        setRelayCodeLocal(code);
        setCodeExpiry(Date.now() + 5 * 60 * 1000);
        setStatus("waiting");
        setError(null);
        addLog(`Relay mode. Code: ${code}`, "info");
        setTransport("relay");
      } else {
        setTransport("p2p");
      }
    }
    init();
    return () => { cancelled = true; cleanup(); };
  }, []);

  // Expiry countdown
  useEffect(() => {
    if (!codeExpiry) return;
    const interval = setInterval(() => {
      const rem = codeExpiry - Date.now();
      if (rem <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
      } else {
        const m = Math.floor(rem / 60000);
        const s = Math.floor((rem % 60000) / 1000);
        setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpiry]);

  const handleSend = async () => {
    if (transport === "relay") {
      setStatus("transferring");
      try {
        await sendViaRelay(files, displayCode ?? "", (sent, total) => {
          addLog(`Uploaded ${sent}/${total}`, "info");
        });
        setStatus("completed");
        addLog("Files ready for download on the web app!", "success");
      } catch (err: any) {
        setError(err.message);
        setStatus("error");
        addLog(`Relay upload failed: ${err.message}`, "error");
      }
    } else {
      sendFiles();
    }
  };

  // Poll /claim endpoint — auto-upload when web receiver enters the code
  useEffect(() => {
    if (transport !== "relay" || !relayCode || files.length === 0) return;
    if (status !== "waiting") return;

    const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://hashdrop.metesahankurt.cloud").replace(/\/$/, "");
    let stopped = false;

    const interval = setInterval(async () => {
      if (stopped || useWarpStore.getState().status !== "waiting") {
        clearInterval(interval);
        return;
      }
      try {
        const res = await fetch(`${WEB_URL}/api/relay/${relayCode}/claim`);
        if (res.ok) {
          const json = await res.json();
          if (json.claimed) {
            stopped = true;
            clearInterval(interval);
            handleSend();
          }
        }
      } catch {
        // ignore network errors, keep polling
      }
    }, 2000);

    return () => { stopped = true; clearInterval(interval); };
  }, [transport, relayCode, files.length, status]);

  const isRelay = transport === "relay";
  const statusColor = getStatusColor(status);

  return (
    <SubShell title="Send Files" onBack={onBack}>
      {/* Status */}
      {status !== "idle" && (
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel(status, progress)}
            </Text>
          </View>
          {status === "transferring" && (
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
            </View>
          )}
        </View>
      )}

      {/* Code + QR */}
      {displayCode ? (
        <View style={styles.codeCard}>
          <Text style={styles.sectionLabel}>Your transfer code</Text>
          <View style={styles.qrWrap}>
            <QRCode
              value={displayCode}
              size={160}
              backgroundColor="transparent"
              color="#3ecf8e"
            />
          </View>
          <TouchableOpacity
            style={styles.codeRow}
            onPress={() => copyToClipboard(displayCode)}
          >
            <Text style={styles.codeText}>{displayCode}</Text>
            <CopyIcon size={16} stroke="#3ecf8e" strokeWidth={2.2} />
          </TouchableOpacity>
          {timeLeft ? (
            <Text style={styles.expiry}>Expires in {timeLeft}</Text>
          ) : null}
        </View>
      ) : null}

      {/* File picker */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Files to send</Text>
        <TouchableOpacity style={styles.dropzone} onPress={pickFiles}>
          <FileUpIcon size={28} stroke="#8b8b8b" strokeWidth={2} />
          <Text style={styles.dropzoneTitle}>Tap to select files</Text>
          <Text style={styles.dropzoneHint}>Any format, up to 10 GB</Text>
        </TouchableOpacity>

        {files.length > 0 && (
          <View style={styles.fileList}>
            {files.map((f, i) => (
              <View key={i} style={styles.fileRow}>
                <Text style={styles.fileEmoji}>{getFileIcon(f.type)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text style={styles.fileSize}>{formatFileSize(f.size)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Relay badge */}
      {isRelay && status === "waiting" && (
        <View style={styles.relayBadge}>
          <Text style={styles.relayBadgeText}>
            Cloud Relay — open this code on the web app to download
          </Text>
        </View>
      )}

      {/* Send button — P2P only; relay auto-uploads when receiver enters the code */}
      {transport === "p2p" && status === "connected" && files.length > 0 && (
        <PrimaryButton onPress={handleSend}>Send files</PrimaryButton>
      )}

      {/* Relay: waiting for receiver hint */}
      {isRelay && status === "waiting" && files.length > 0 && (
        <View style={styles.relayBadge}>
          <Text style={styles.relayBadgeText}>
            Waiting for the recipient to enter the code on the web app…
          </Text>
        </View>
      )}

      {/* Success */}
      {status === "completed" && (
        <View style={styles.successRow}>
          <CheckIcon size={18} stroke="#3ecf8e" strokeWidth={2.2} />
          <Text style={styles.successText}>
            {isRelay ? "Files uploaded — recipient can now download!" : "Files delivered!"}
          </Text>
        </View>
      )}

      {status === "error" && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>{error}</Text>
        </View>
      )}

      {(status === "completed" || status === "error") && (
        <PrimaryButton tone="secondary" onPress={initSender}>
          New transfer
        </PrimaryButton>
      )}
    </SubShell>
  );
}

// ---------------------------------------------------------------------------
// Receive screen
// ---------------------------------------------------------------------------
function TransferReceiveView({ onBack }: { onBack: () => void }) {
  const { status, progress, error } = useWarpStore();
  const { connect, saveFile, copyToClipboard, cleanup, receivedFiles } =
    useWarpPeer();

  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => () => cleanup(), []);

  const normalizedCode = code.toUpperCase();
  const codeValid = !code || isValidCode(normalizedCode);
  const canConnect =
    normalizedCode.length > 0 &&
    codeValid &&
    status !== "connecting" &&
    status !== "transferring";

  const statusColor = getStatusColor(status);

  if (showScanner) {
    return (
      <QRScanner
        onScan={(scanned) => {
          setShowScanner(false);
          setCode(scanned);
          connect(scanned);
        }}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <SubShell title="Receive Files" onBack={onBack}>
      {/* Status */}
      {status !== "idle" && (
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel(status, progress)}
            </Text>
          </View>
        </View>
      )}

      {/* Code input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Enter transfer code</Text>
        <TextField
          label=""
          placeholder="COSMIC-FALCON"
          value={normalizedCode}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
        />
        {!codeValid && (
          <Text style={styles.errorText}>Use the WORD-WORD format.</Text>
        )}
        <PrimaryButton
          disabled={!canConnect}
          onPress={() => connect(normalizedCode)}
        >
          Connect
        </PrimaryButton>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <PrimaryButton tone="secondary" onPress={() => setShowScanner(true)}>
          <ScanIcon size={15} stroke="#ededed" strokeWidth={2.2} />{"  "}
          Scan QR code
        </PrimaryButton>
      </View>

      {/* Received files */}
      {receivedFiles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Received files</Text>
          {receivedFiles.map((file: ReceivedFile, i: number) => (
            <TouchableOpacity
              key={i}
              style={styles.receivedFileRow}
              onPress={() => saveFile(file)}
            >
              <Text style={styles.fileEmoji}>{getFileIcon(file.mimeType)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
              </View>
              <ReceiveIcon size={16} stroke="#3ecf8e" strokeWidth={2.2} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {status === "error" && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>{error}</Text>
        </View>
      )}

      {(status === "completed" || status === "error") && (
        <PrimaryButton tone="secondary" onPress={cleanup}>
          New transfer
        </PrimaryButton>
      )}
    </SubShell>
  );
}

// ---------------------------------------------------------------------------
// Text share screen
// ---------------------------------------------------------------------------
function TransferTextView({ onBack }: { onBack: () => void }) {
  const { status, displayCode } = useWarpStore();
  const { initTextSender, connectForText, copyToClipboard, cleanup } =
    useWarpPeer();

  const [tab, setTab] = useState<"send" | "receive">("send");
  const [text, setText] = useState("");
  const [receiveCode, setReceiveCode] = useState("");
  const [receivedText, setReceivedText] = useState("");

  useEffect(() => () => cleanup(), []);

  const canSend = text.trim().length > 0 && status === "idle";
  const canReceive =
    receiveCode.trim().length > 0 &&
    isValidCode(receiveCode.toUpperCase()) &&
    status === "idle";

  return (
    <SubShell title="Text Share" onBack={onBack}>
      {/* Tab switcher */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "send" && styles.tabActive]}
          onPress={() => { cleanup(); setTab("send"); }}
        >
          <Text style={[styles.tabText, tab === "send" && styles.tabTextActive]}>
            Send
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "receive" && styles.tabActive]}
          onPress={() => { cleanup(); setTab("receive"); }}
        >
          <Text
            style={[styles.tabText, tab === "receive" && styles.tabTextActive]}
          >
            Receive
          </Text>
        </Pressable>
      </View>

      {tab === "send" ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your text or link</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Paste or type here..."
              placeholderTextColor="#8b8b8b"
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <PrimaryButton
              disabled={!canSend}
              onPress={() => initTextSender(text)}
            >
              Generate code & share
            </PrimaryButton>
          </View>

          {displayCode && status !== "idle" && (
            <View style={styles.codeCard}>
              <Text style={styles.sectionLabel}>Share this code</Text>
              <View style={styles.qrWrap}>
                <QRCode
                  value={displayCode}
                  size={140}
                  backgroundColor="transparent"
                  color="#f59e0b"
                />
              </View>
              <TouchableOpacity
                style={[styles.codeRow, styles.codeRowAmber]}
                onPress={() => copyToClipboard(displayCode)}
              >
                <Text style={[styles.codeText, { color: "#f59e0b" }]}>
                  {displayCode}
                </Text>
                <CopyIcon size={16} stroke="#f59e0b" strokeWidth={2.2} />
              </TouchableOpacity>
              <Text style={styles.expiry}>
                {status === "waiting"
                  ? "Waiting for receiver..."
                  : "Text delivered!"}
              </Text>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Enter sender's code</Text>
            <TextField
              label=""
              placeholder="COSMIC-FALCON"
              value={receiveCode.toUpperCase()}
              onChangeText={(v) => setReceiveCode(v.toUpperCase())}
              autoCapitalize="characters"
                />
            <PrimaryButton
              disabled={!canReceive}
              onPress={() =>
                connectForText(receiveCode, (t) => setReceivedText(t))
              }
            >
              Receive text
            </PrimaryButton>
          </View>

          {receivedText ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Received</Text>
              <View style={styles.receivedTextBox}>
                <Text style={styles.receivedTextContent}>{receivedText}</Text>
              </View>
              <PrimaryButton
                tone="secondary"
                onPress={() => copyToClipboard(receivedText)}
              >
                Copy to clipboard
              </PrimaryButton>
            </View>
          ) : null}
        </>
      )}
    </SubShell>
  );
}

// ---------------------------------------------------------------------------
// Sub-screen shell (back button + scroll + safe area)
// ---------------------------------------------------------------------------
function SubShell({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <BackIcon size={20} stroke="#ededed" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.subTitle}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Root screen — mode controller
// ---------------------------------------------------------------------------
export function TransferScreen() {
  const [mode, setMode] = useState<TransferMode>("hub");

  if (mode === "send") return <TransferSendView onBack={() => setMode("hub")} />;
  if (mode === "receive") return <TransferReceiveView onBack={() => setMode("hub")} />;
  if (mode === "text") return <TransferTextView onBack={() => setMode("hub")} />;
  return <TransferHub onSelect={setMode} />;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getStatusColor(status: string) {
  if (status === "completed") return "#3ecf8e";
  if (status === "error") return "#ef4444";
  if (status === "transferring" || status === "connecting") return "#a5b4fc";
  return "#8b8b8b";
}

function statusLabel(status: string, progress: number) {
  switch (status) {
    case "waiting": return "Waiting for receiver...";
    case "connecting": return "Connecting...";
    case "connected": return "Connected";
    case "transferring": return `Transferring... ${Math.round(progress)}%`;
    case "completed": return "Complete!";
    case "error": return "Failed";
    default: return "";
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // Hub cards
  card: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGreen: {
    backgroundColor: "rgba(62,207,142,0.1)",
    borderColor: "rgba(62,207,142,0.22)",
  },
  iconBlue: {
    backgroundColor: "rgba(129,140,248,0.12)",
    borderColor: "rgba(129,140,248,0.24)",
  },
  iconAmber: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.24)",
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeGreen: {
    backgroundColor: "rgba(62,207,142,0.12)",
    borderColor: "rgba(62,207,142,0.18)",
  },
  badgeBlue: {
    backgroundColor: "rgba(129,140,248,0.12)",
    borderColor: "rgba(129,140,248,0.18)",
  },
  badgeAmber: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.18)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  cardTitle: { color: "#ededed", fontSize: 18, fontWeight: "700" },
  cardDesc: { color: "#8b8b8b", fontSize: 13, lineHeight: 19 },

  // Sub-screen shell
  safeArea: { flex: 1, backgroundColor: "#0d0d0d" },
  scroll: { flex: 1, backgroundColor: "#0d0d0d" },
  scrollContent: { padding: 20, paddingBottom: 220, gap: 18 },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  subTitle: { fontSize: 17, fontWeight: "700", color: "#ededed" },

  // Status
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 14,
    gap: 8,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: "600" },
  progressBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#a5b4fc", borderRadius: 2 },

  // Code / QR
  codeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 18,
    gap: 14,
    alignItems: "center",
  },
  qrWrap: {
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(62,207,142,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.2)",
  },
  codeRowAmber: {
    backgroundColor: "rgba(245,158,11,0.06)",
    borderColor: "rgba(245,158,11,0.2)",
  },
  codeText: { fontSize: 18, fontWeight: "700", color: "#3ecf8e", letterSpacing: 1 },
  expiry: { fontSize: 12, color: "#8b8b8b" },

  // Section
  section: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 18,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    color: "#8b8b8b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Dropzone
  dropzone: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  dropzoneTitle: { fontSize: 15, fontWeight: "600", color: "#ededed" },
  dropzoneHint: { fontSize: 12, color: "#8b8b8b" },

  // File list
  fileList: { gap: 8 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 10,
    borderRadius: 10,
  },
  receivedFileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(62,207,142,0.04)",
    borderWidth: 1,
    borderColor: "rgba(62,207,142,0.12)",
    padding: 12,
    borderRadius: 12,
  },
  fileEmoji: { fontSize: 20 },
  fileName: { fontSize: 13, fontWeight: "500", color: "#ededed" },
  fileSize: { fontSize: 11, color: "#8b8b8b", marginTop: 2 },

  // Success
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  successText: { fontSize: 14, color: "#3ecf8e", fontWeight: "500" },

  // Relay badge
  relayBadge: {
    borderRadius: 12,
    backgroundColor: "rgba(165,180,252,0.08)",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.2)",
    padding: 12,
  },
  relayBadgeText: {
    color: "#a5b4fc",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  // Error
  errorText: { fontSize: 12, color: "#f87171" },
  errorBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
    backgroundColor: "rgba(248,113,113,0.06)",
    padding: 14,
  },
  errorBoxText: {
    color: "#f87171",
    fontSize: 13,
    lineHeight: 20,
  },

  // Divider
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  dividerLabel: { fontSize: 12, color: "#8b8b8b" },

  // Tabs (text share)
  tabs: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "rgba(255,255,255,0.08)" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#8b8b8b" },
  tabTextActive: { color: "#ededed" },

  // Text share
  textArea: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 14,
    color: "#ededed",
    fontSize: 15,
    minHeight: 120,
  },
  receivedTextBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
  },
  receivedTextContent: { color: "#ededed", fontSize: 15, lineHeight: 22 },
});
