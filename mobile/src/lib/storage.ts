import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TransferRecord {
  id: string;
  type: "send" | "receive" | "text";
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  timestamp: number;
  duration?: number;
  transferSpeed?: number;
  success: boolean;
  peerId?: string;
}

const STORAGE_KEY = "hashdrop_transfer_history";

export async function getTransferHistory(): Promise<TransferRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addTransferRecord(record: Omit<TransferRecord, "id" | "timestamp">): Promise<void> {
  try {
    const history = await getTransferHistory();
    const newRecord: TransferRecord = {
      ...record,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    history.unshift(newRecord);
    // Keep only last 100 records
    const trimmed = history.slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fail
  }
}

export async function clearTransferHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function getTransferStats() {
  const history = await getTransferHistory();
  const sent = history.filter((r) => r.type === "send" && r.success);
  const received = history.filter((r) => r.type === "receive" && r.success);
  const totalBytes = history
    .filter((r) => r.success && r.fileSize)
    .reduce((sum, r) => sum + (r.fileSize || 0), 0);

  return {
    totalTransfers: history.length,
    sentCount: sent.length,
    receivedCount: received.length,
    totalBytes,
    successRate:
      history.length > 0
        ? Math.round((history.filter((r) => r.success).length / history.length) * 100)
        : 0,
  };
}
