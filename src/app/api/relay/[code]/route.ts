import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory relay store
// Works on single-instance deployments (Vercel free tier, render.com).
// For multi-instance production: swap with Vercel KV / Upstash Redis.
// ---------------------------------------------------------------------------

interface RelayFile {
  name: string;
  mimeType: string;
  size: number;
  data: Buffer;
}

interface RelayEntry {
  files: RelayFile[];
  expiresAt: number;
}

// Module-level Map persists across requests within the same server instance.
const store = new Map<string, RelayEntry>();
const TTL_MS = 15 * 60 * 1000; // 15 minutes

function sweep() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(key);
  }
}

// POST /api/relay/[code]
// Body: multipart/form-data with one or more "file" fields.
// Mobile calls this to upload files keyed by the transfer code.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  sweep();
  const { code } = await params;
  const key = code.toUpperCase();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const incoming = formData.getAll("file") as File[];
  if (!incoming.length) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const files: RelayFile[] = await Promise.all(
    incoming.map(async (f) => ({
      name: f.name,
      mimeType: f.type || "application/octet-stream",
      size: f.size,
      data: Buffer.from(await f.arrayBuffer()),
    })),
  );

  // Append to existing entry if code is already active (multiple POSTs)
  const existing = store.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    existing.files.push(...files);
  } else {
    store.set(key, { files, expiresAt: Date.now() + TTL_MS });
  }

  return NextResponse.json({ success: true, count: files.length });
}

// GET /api/relay/[code]
// Without ?index: returns JSON list of available files.
// With ?index=N: downloads file at position N.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const key = code.toUpperCase();
  const entry = store.get(key);

  if (!entry || entry.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const indexParam = request.nextUrl.searchParams.get("index");

  if (indexParam === null) {
    // Return file list (metadata only, no data)
    return NextResponse.json({
      files: entry.files.map((f, i) => ({
        index: i,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
      })),
      expiresAt: entry.expiresAt,
    });
  }

  const index = parseInt(indexParam, 10);
  const file = entry.files[index];
  if (!file) {
    return NextResponse.json({ error: "File index out of range" }, { status: 404 });
  }

  return new NextResponse(file.data as unknown as BodyInit, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
      "Content-Length": file.data.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}

// DELETE /api/relay/[code] — cleanup after receiver downloads
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  store.delete(code.toUpperCase());
  return NextResponse.json({ success: true });
}
