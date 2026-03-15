import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

interface SerializedRelayFile {
  name: string;
  mimeType: string;
  size: number;
  data: string;
}

interface SerializedRelayEntry {
  files: SerializedRelayFile[];
  expiresAt: number;
  claimed: boolean;
}

export const TTL_MS = 15 * 60 * 1000; // 15 minutes

const RELAY_DIR = path.join(os.tmpdir(), "hashdrop-relay-store");

function ensureRelayDir() {
  fs.mkdirSync(RELAY_DIR, { recursive: true });
}

function relayPath(key: string) {
  return path.join(RELAY_DIR, `${key}.json`);
}

function serializeEntry(entry: RelayEntry): SerializedRelayEntry {
  return {
    ...entry,
    files: entry.files.map((file) => ({
      ...file,
      data: file.data.toString("base64"),
    })),
  };
}

function deserializeEntry(entry: SerializedRelayEntry): RelayEntry {
  return {
    ...entry,
    files: entry.files.map((file) => ({
      ...file,
      data: Buffer.from(file.data, "base64"),
    })),
  };
}

export function getRelayEntry(key: string): RelayEntry | null {
  ensureRelayDir();

  try {
    const raw = fs.readFileSync(relayPath(key), "utf8");
    const parsed = JSON.parse(raw) as SerializedRelayEntry;
    return deserializeEntry(parsed);
  } catch {
    return null;
  }
}

export function setRelayEntry(key: string, entry: RelayEntry) {
  ensureRelayDir();
  fs.writeFileSync(
    relayPath(key),
    JSON.stringify(serializeEntry(entry)),
    "utf8",
  );
}

export function deleteRelayEntry(key: string) {
  try {
    fs.unlinkSync(relayPath(key));
  } catch {
    // no-op
  }
}

export function sweepRelayEntries() {
  ensureRelayDir();
  const now = Date.now();

  for (const file of fs.readdirSync(RELAY_DIR)) {
    if (!file.endsWith(".json")) continue;

    const filePath = path.join(RELAY_DIR, file);

    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw) as SerializedRelayEntry;
      if (parsed.expiresAt < now) {
        fs.unlinkSync(filePath);
      }
    } catch {
      fs.unlinkSync(filePath);
    }
  }
}
