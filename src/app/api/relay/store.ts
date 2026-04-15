import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

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
const CHUNK_DIR = path.join(RELAY_DIR, "chunks");

function ensureRelayDir() {
  fs.mkdirSync(RELAY_DIR, { recursive: true });
  fs.mkdirSync(CHUNK_DIR, { recursive: true });
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

export function appendRelayFiles(
  key: string,
  files: RelayFile[],
  claimed = false,
) {
  const existing = getRelayEntry(key);

  if (existing && existing.expiresAt > Date.now()) {
    existing.files.push(...files);
    setRelayEntry(key, existing);
    return;
  }

  setRelayEntry(key, {
    files,
    expiresAt: Date.now() + TTL_MS,
    claimed: existing?.claimed ?? claimed,
  });
}

function chunkBaseDir(key: string) {
  return path.join(CHUNK_DIR, key);
}

function chunkFileDir(key: string, fileId: string) {
  const safeId = crypto.createHash("sha1").update(fileId).digest("hex");
  return path.join(chunkBaseDir(key), safeId);
}

interface ChunkMeta {
  fileName: string;
  mimeType: string;
  fileSize: number;
  totalChunks: number;
}

export function stageRelayChunk(
  key: string,
  fileId: string,
  chunkIndex: number,
  chunk: Buffer,
  meta: ChunkMeta,
) {
  ensureRelayDir();

  const dir = chunkFileDir(key, fileId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta), "utf8");
  fs.writeFileSync(path.join(dir, `${chunkIndex}.part`), chunk);

  for (let index = 0; index < meta.totalChunks; index += 1) {
    if (!fs.existsSync(path.join(dir, `${index}.part`))) {
      return { complete: false as const };
    }
  }

  const parts: Buffer[] = [];
  for (let index = 0; index < meta.totalChunks; index += 1) {
    parts.push(fs.readFileSync(path.join(dir, `${index}.part`)));
  }

  const data = Buffer.concat(parts);
  appendRelayFiles(key, [{
    name: meta.fileName,
    mimeType: meta.mimeType,
    size: meta.fileSize || data.length,
    data,
  }]);

  fs.rmSync(dir, { recursive: true, force: true });
  return { complete: true as const };
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

  for (const entry of fs.readdirSync(CHUNK_DIR)) {
    const dir = path.join(CHUNK_DIR, entry);
    try {
      const stat = fs.statSync(dir);
      if (now - stat.mtimeMs > TTL_MS) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}
