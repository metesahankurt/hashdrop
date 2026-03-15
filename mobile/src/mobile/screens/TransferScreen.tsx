import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowDownToLine,
  ArrowLeft,
  CheckCircle,
  Copy,
  FileUp,
  Link as LinkIconRaw,
  ScanLine,
  Send,
  X,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";

import { useWarpStore } from "@/store/use-warp-store";
import { generateSecureCode, isValidCode } from "@/lib/code-generator";
import { formatFileSize, getFileIcon } from "@/lib/file-utils";
import {
  useWarpPeer,
  sendViaRelay,
  type ReceivedFile,
} from "@/mobile/hooks/use-warp-peer";
import { PrimaryButton } from "@/mobile/components/PrimaryButton";
import { QRScanner } from "@/mobile/components/QRScanner";
import { useProfileStore } from "@/mobile/state/use-profile-store";

const SendIcon = Send as any;
const ReceiveIcon = ArrowDownToLine as any;
const CopyIcon = Copy as any;
const LinkIcon = LinkIconRaw as any;
const ScanIcon = ScanLine as any;
const BackIcon = ArrowLeft as any;
const FileUpIcon = FileUp as any;
const CheckIcon = CheckCircle as any;

type TransferMode = "hub" | "send" | "receive";
const RELAY_PREFERRED_FILE_BYTES = 4 * 1024 * 1024;
const RELAY_PREFERRED_TOTAL_BYTES = 10 * 1024 * 1024;
const DOCK_HEIGHT = 64;
const DOCK_GAP = 24;

// ---------------------------------------------------------------------------
// Hub
// ---------------------------------------------------------------------------
function TransferHub({ onSelect }: { onSelect: (m: TransferMode) => void }) {
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = Math.max(insets.bottom, 12) + DOCK_HEIGHT + DOCK_GAP;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.hubContent, { paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <View style={styles.heroTopBar}>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandText}>FILE TRANSFER</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>P2P</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Send & receive any file.</Text>
          <Text style={styles.heroSubtitle}>
            Direct device-to-device. No cloud, no tracking, no limits.
          </Text>
        </View>

        {/* Mode label */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose mode</Text>
          <Text style={styles.sectionMeta}>2 options</Text>
        </View>

        {/* Send card */}
        <Pressable
          style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
          onPress={() => onSelect("send")}
        >
          <View style={styles.modeCardInner}>
            <View style={styles.modeCardTop}>
              <View style={styles.modeIconWrap}>
                <SendIcon size={22} stroke="#ededed" strokeWidth={1.9} />
              </View>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>SEND</Text>
              </View>
            </View>
            <View style={styles.modeCardBody}>
              <Text style={styles.modeTitle}>Send files</Text>
              <Text style={styles.modeDesc}>
                Generate a one-time code and share your files with any device.
              </Text>
            </View>
            <View style={styles.modeFooter}>
              <Text style={styles.modeCtaText}>Open sender</Text>
              <ArrowRightSmall />
            </View>
          </View>
        </Pressable>

        {/* Receive card */}
        <Pressable
          style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
          onPress={() => onSelect("receive")}
        >
          <View style={styles.modeCardInner}>
            <View style={styles.modeCardTop}>
              <View style={styles.modeIconWrap}>
                <ReceiveIcon size={22} stroke="#ededed" strokeWidth={1.9} />
              </View>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>RECEIVE</Text>
              </View>
            </View>
            <View style={styles.modeCardBody}>
              <Text style={styles.modeTitle}>Receive files</Text>
              <Text style={styles.modeDesc}>
                Enter a sender's code or scan a QR to download files instantly.
              </Text>
            </View>
            <View style={styles.modeFooter}>
              <Text style={styles.modeCtaText}>Open receiver</Text>
              <ArrowRightSmall />
            </View>
          </View>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Send view
// ---------------------------------------------------------------------------
function TransferSendView({ onBack }: { onBack: () => void }) {
  const {
    files, displayCode, status, progress, codeExpiry, error,
    setStatus, setProgress, setError, setDisplayCode, setCodeExpiry,
    setFiles, addLog,
  } = useWarpStore();
  const { initSender, sendFiles, pickFiles, copyToClipboard, cleanup } = useWarpPeer();
  const { username } = useProfileStore();

  const [timeLeft, setTimeLeft] = useState("");
  const [transport, setTransport] = useState<"p2p" | "relay" | "detecting">("detecting");
  const [relayCode, setRelayCodeLocal] = useState<string | null>(null);

  const initWithFallback = useCallback(async () => {
    setTransport("detecting");
    setRelayCodeLocal(null);
    setFiles([]);
    await initSender();
    const afterStatus = useWarpStore.getState().status;
    if (afterStatus === "error") {
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
  }, [initSender, setDisplayCode, setCodeExpiry, setStatus, setError, setFiles, addLog]);

  const refreshCode = useCallback(async () => {
    setTransport("detecting");
    setRelayCodeLocal(null);
    setTimeLeft("");
    await initSender();
    const afterStatus = useWarpStore.getState().status;
    if (afterStatus === "error") {
      const code = generateSecureCode();
      setDisplayCode(code);
      setRelayCodeLocal(code);
      setCodeExpiry(Date.now() + 5 * 60 * 1000);
      setStatus("waiting");
      setError(null);
      addLog(`Code expired. Relay mode refreshed: ${code}`, "info");
      setTransport("relay");
    } else {
      addLog("Code expired. Generated a new transfer code.", "info");
      setTransport("p2p");
    }
  }, [initSender, setDisplayCode, setCodeExpiry, setStatus, setError, addLog]);

  useEffect(() => {
    let cancelled = false;
    initWithFallback().then(() => { if (cancelled) {} });
    return () => { cancelled = true; cleanup(); };
  }, []);

  useEffect(() => {
    if (!codeExpiry) return;
    let refreshing = false;
    const interval = setInterval(() => {
      const rem = codeExpiry - Date.now();
      if (rem <= 0) {
        clearInterval(interval);
        if (!refreshing && useWarpStore.getState().status !== "completed") {
          refreshing = true;
          void refreshCode();
        }
      } else {
        const m = Math.floor(rem / 60000);
        const s = Math.floor((rem % 60000) / 1000);
        setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpiry, refreshCode]);

  const handleSend = async () => {
    if (transport === "relay") {
      setStatus("transferring");
      setProgress(0);
      try {
        await sendViaRelay(files, displayCode ?? "", (sent, total) => {
          setProgress((sent / total) * 100);
          addLog(`Uploaded ${sent}/${total}`, "info");
        });
        setProgress(100);
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

  useEffect(() => {
    if (transport !== "relay" || !relayCode || files.length === 0) return;
    if (status !== "waiting") return;
    const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://hashdrop.metesahankurt.cloud").replace(/\/$/, "");
    let stopped = false;
    const interval = setInterval(async () => {
      if (stopped || useWarpStore.getState().status !== "waiting") { clearInterval(interval); return; }
      try {
        const res = await fetch(`${WEB_URL}/api/relay/${relayCode}/claim`);
        if (res.ok) {
          const json = await res.json();
          if (json.claimed) { stopped = true; clearInterval(interval); handleSend(); }
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => { stopped = true; clearInterval(interval); };
  }, [transport, relayCode, files.length, status]);

  const isRelay = transport === "relay";
  const statusColor = getStatusColor(status);
  const relayRecommended = shouldPreferRelay(files);
  const shareUrl = displayCode
    ? `https://hashdrop.metesahankurt.cloud/transfer?code=${encodeURIComponent(displayCode)}&from=${encodeURIComponent(username || "Someone")}`
    : null;

  const handlePickFiles = useCallback(async () => {
    await pickFiles();
    const selectedFiles = useWarpStore.getState().files;
    if (!selectedFiles.length) return;
    if (shouldPreferRelay(selectedFiles)) {
      setTransport("relay");
      setRelayCodeLocal(useWarpStore.getState().displayCode || null);
      addLog("Optimized upload enabled for photos and large files.", "info");
    }
  }, [pickFiles, addLog]);

  return (
    <SubShell title="Send Files" onBack={onBack}>

      {/* Status card */}
      {status !== "idle" && (
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel(status, progress)}
            </Text>
          </View>
          {status === "transferring" && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
            </View>
          )}
        </View>
      )}

      {/* Code + QR card */}
      {displayCode ? (
        <View style={styles.codeCard}>
          <View style={styles.codeCardHeader}>
            <Text style={styles.cardLabel}>Transfer code</Text>
            {timeLeft ? (
              <Text style={styles.expiryText}>Expires {timeLeft}</Text>
            ) : null}
          </View>

          <View style={styles.qrBox}>
            <QRCode
              value={shareUrl ?? displayCode}
              size={152}
              backgroundColor="transparent"
              color="#ededed"
            />
          </View>

          <TouchableOpacity
            style={styles.codeRow}
            onPress={() => copyToClipboard(displayCode)}
          >
            <Text style={styles.codeText}>{displayCode}</Text>
            <View style={styles.codeActions}>
              {shareUrl ? (
                <TouchableOpacity
                  onPress={() => copyToClipboard(shareUrl)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <LinkIcon size={15} stroke="#a5b4fc" strokeWidth={2.2} />
                </TouchableOpacity>
              ) : null}
              <CopyIcon size={15} stroke="#ededed" strokeWidth={2.2} />
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* File picker */}
      <View style={styles.section}>
        <Text style={styles.cardLabel}>Files to send</Text>
        <TouchableOpacity style={styles.dropzone} onPress={handlePickFiles}>
          <View style={styles.dropzoneIconWrap}>
            <FileUpIcon size={24} stroke="#ededed" strokeWidth={1.8} />
          </View>
          <Text style={styles.dropzoneTitle}>Tap to select files</Text>
          <Text style={styles.dropzoneHint}>Any format · up to 10 GB</Text>
        </TouchableOpacity>

        {files.length > 0 && (
          <View style={styles.fileList}>
            {files.map((f, i) => (
              <View key={i} style={styles.fileRow}>
                <View style={styles.fileIconBadge}>
                  <Text style={styles.fileIconText}>{getFileIcon(f.type)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.fileSize}>{formatFileSize(f.size)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info banners */}
      {(relayRecommended || (isRelay && status === "waiting")) && (
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerDot} />
          <Text style={styles.infoBannerText}>
            {relayRecommended
              ? "Photo optimization active — using faster relay upload."
              : "Cloud Relay — open this code on the web app to download."}
          </Text>
        </View>
      )}

      {/* Primary action */}
      {transport === "p2p" && status === "connected" && files.length > 0 && (
        <PrimaryButton onPress={handleSend}>Send files</PrimaryButton>
      )}

      {isRelay && status === "waiting" && files.length > 0 && (
        <>
          <PrimaryButton onPress={handleSend}>Upload & share</PrimaryButton>
          <View style={styles.infoBanner}>
            <View style={styles.infoBannerDot} />
            <Text style={styles.infoBannerText}>
              Tap above, then enter the code on the web app — or wait for the recipient to enter it first.
            </Text>
          </View>
        </>
      )}

      {/* Success */}
      {status === "completed" && (
        <View style={styles.successRow}>
          <CheckIcon size={17} stroke="#3ecf8e" strokeWidth={2.2} />
          <Text style={styles.successText}>
            {isRelay ? "Files uploaded — recipient can now download!" : "Files delivered!"}
          </Text>
        </View>
      )}

      {/* Error */}
      {status === "error" && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>{error}</Text>
        </View>
      )}

      {(status === "completed" || status === "error") && (
        <PrimaryButton tone="secondary" onPress={initWithFallback}>
          New transfer
        </PrimaryButton>
      )}
    </SubShell>
  );
}

// ---------------------------------------------------------------------------
// Receive view
// ---------------------------------------------------------------------------
function TransferReceiveView({ onBack }: { onBack: () => void }) {
  const { status, progress, error } = useWarpStore();
  const { connect, saveFile, copyToClipboard, cleanup, receivedFiles } = useWarpPeer();

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
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel(status, progress)}
            </Text>
          </View>
        </View>
      )}

      {/* Code entry card */}
      <View style={styles.receiveCard}>
        <View style={styles.receiveCardHeader}>
          <View style={styles.receiveIconWrap}>
            <ReceiveIcon size={20} stroke="#ededed" strokeWidth={1.9} />
          </View>
          <Text style={styles.cardLabel}>Transfer code</Text>
        </View>

        <TextInput
          style={styles.codeInput}
          placeholder="COSMIC-FALCON"
          placeholderTextColor="#2e2e2e"
          value={normalizedCode}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {!codeValid && (
          <Text style={styles.inputError}>Use the WORD-WORD format.</Text>
        )}

        <PrimaryButton disabled={!canConnect} onPress={() => connect(normalizedCode)}>
          Connect
        </PrimaryButton>
      </View>

      {/* QR scan — standalone row */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>or scan</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.scanBtn, pressed && styles.scanBtnPressed]}
        onPress={() => setShowScanner(true)}
      >
        <View style={styles.scanBtnIcon}>
          <ScanIcon size={18} stroke="#ededed" strokeWidth={2} />
        </View>
        <Text style={styles.scanBtnText}>Scan QR code</Text>
      </Pressable>

      {/* Received files */}
      {receivedFiles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.cardLabel}>Received files</Text>
          {receivedFiles.map((file: ReceivedFile, i: number) => (
            <TouchableOpacity
              key={i}
              style={styles.receivedFileRow}
              onPress={() => saveFile(file)}
            >
              <View style={styles.fileIconBadge}>
                <Text style={styles.fileIconText}>{getFileIcon(file.mimeType)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
              </View>
              <View style={styles.downloadBtn}>
                <ReceiveIcon size={14} stroke="#ededed" strokeWidth={2.2} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Error */}
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
// SubShell — responsive padding
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
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = Math.max(insets.bottom, 12) + DOCK_HEIGHT + DOCK_GAP;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.subContent, { paddingBottom: scrollPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <BackIcon size={18} stroke="#ededed" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.subTitle}>{title}</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
export function TransferScreen() {
  const [mode, setMode] = useState<TransferMode>("hub");
  if (mode === "send") return <TransferSendView onBack={() => setMode("hub")} />;
  if (mode === "receive") return <TransferReceiveView onBack={() => setMode("hub")} />;
  return <TransferHub onSelect={setMode} />;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ArrowRightSmall() {
  const ArrowRight = require("lucide-react-native").ArrowRight as any;
  return <ArrowRight size={13} stroke="#666" strokeWidth={2.2} />;
}

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

function shouldPreferRelay(files: Array<{ size: number; type: string }>) {
  if (!files.length) return false;
  let totalBytes = 0;
  for (const file of files) {
    totalBytes += file.size || 0;
    const mime = (file.type || "").toLowerCase();
    const isMedia = mime.startsWith("image/") || mime.startsWith("video/");
    if (isMedia && (file.size || 0) >= RELAY_PREFERRED_FILE_BYTES) return true;
  }
  return totalBytes >= RELAY_PREFERRED_TOTAL_BYTES;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0d0d0d" },
  scroll: { flex: 1, backgroundColor: "#0d0d0d" },

  // ── HUB
  hubContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#101010",
    padding: 24,
    paddingBottom: 28,
    gap: 14,
    overflow: "hidden",
  },
  heroOrb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(62,207,142,0.08)",
    top: -80,
    right: -70,
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3ecf8e",
  },
  brandText: {
    color: "#3ecf8e",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  heroPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroPillText: {
    color: "#666",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#ededed",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    color: "#5c5c5c",
    fontSize: 14,
    lineHeight: 21,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#ededed",
    fontSize: 17,
    fontWeight: "800",
  },
  sectionMeta: {
    color: "#444",
    fontSize: 12,
    fontWeight: "700",
  },
  modeCard: {
    borderRadius: 22,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modeCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.984 }],
  },
  modeCardInner: {
    padding: 20,
    gap: 14,
  },
  modeCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeBadgeText: {
    color: "#555",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  modeCardBody: { gap: 5 },
  modeTitle: {
    color: "#ededed",
    fontSize: 19,
    fontWeight: "700",
  },
  modeDesc: {
    color: "#5a5a5a",
    fontSize: 13,
    lineHeight: 19,
  },
  modeFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  modeCtaText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "600",
  },

  // ── SUBSHELL
  subContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPlaceholder: { width: 38 },
  subTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ededed",
    letterSpacing: -0.2,
  },

  // ── STATUS
  statusCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    padding: 16,
    gap: 10,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: "600" },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#a5b4fc",
    borderRadius: 999,
  },

  // ── CODE / QR
  codeCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    padding: 20,
    gap: 16,
    alignItems: "center",
  },
  codeCardHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 11,
    color: "#555",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  expiryText: {
    fontSize: 11,
    color: "#444",
    fontWeight: "600",
  },
  qrBox: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  codeRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  codeText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ededed",
    letterSpacing: 0.5,
  },
  codeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  // ── SECTION (file picker / code input)
  section: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    padding: 20,
    gap: 14,
  },

  // ── DROPZONE
  dropzone: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  dropzoneIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  dropzoneTitle: { fontSize: 14, fontWeight: "600", color: "#c0c0c0" },
  dropzoneHint: { fontSize: 12, color: "#444" },

  // ── FILE LIST
  fileList: { gap: 8 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  fileIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileIconText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#aaa",
    letterSpacing: 0.2,
  },
  fileName: { fontSize: 13, fontWeight: "500", color: "#d4d4d4" },
  fileSize: { fontSize: 11, color: "#444", marginTop: 2 },

  receivedFileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 12,
    borderRadius: 14,
  },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── RECEIVE CARD
  receiveCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    padding: 20,
    gap: 14,
  },
  receiveCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  receiveIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── CODE INPUT
  codeInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#ededed",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 18,
    paddingVertical: 15,
    letterSpacing: 1,
  },
  inputError: { fontSize: 12, color: "#f87171" },

  // ── DIVIDER ROW
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
  },

  // ── SCAN BUTTON
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111111",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scanBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.984 }],
  },
  scanBtnIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtnText: {
    color: "#c0c0c0",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── INFO BANNER
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    backgroundColor: "rgba(165,180,252,0.06)",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.14)",
    padding: 14,
  },
  infoBannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#a5b4fc",
    marginTop: 4,
    flexShrink: 0,
  },
  infoBannerText: {
    flex: 1,
    color: "#8899cc",
    fontSize: 13,
    lineHeight: 19,
  },

  // ── SUCCESS / ERROR
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  successText: { fontSize: 14, color: "#3ecf8e", fontWeight: "500" },
  errorBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.18)",
    backgroundColor: "rgba(248,113,113,0.05)",
    padding: 14,
  },
  errorBoxText: { color: "#f87171", fontSize: 13, lineHeight: 20 },

  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.07)" },
  dividerLabel: { fontSize: 12, color: "#444", fontWeight: "600" },
});
