export interface RelayFile {
  name: string;
  mimeType: string;
  size: number;
  data: Buffer;
}

export interface RelayEntry {
  files: RelayFile[];
  expiresAt: number;
  claimed: boolean;
}

export const TTL_MS = 15 * 60 * 1000; // 15 minutes

// Module-level singleton — persists across requests in the same Node.js process.
export const relayStore = new Map<string, RelayEntry>();
