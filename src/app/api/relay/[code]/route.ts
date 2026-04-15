import { NextRequest, NextResponse } from "next/server";
import {
  appendRelayFiles,
  deleteRelayEntry,
  getRelayEntry,
  type RelayFile,
  stageRelayChunk,
  sweepRelayEntries,
} from "../store";

// POST /api/relay/[code]
// Body: multipart/form-data with one or more "file" fields.
// Mobile calls this to upload files keyed by the transfer code.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  sweepRelayEntries();
  const { code } = await params;
  const key = code.toUpperCase();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const incoming = formData.getAll("file") as File[];
  const chunk = formData.get("chunk");

  if (chunk instanceof File) {
    const fileId = formData.get("fileId");
    const fileName = formData.get("fileName");
    const mimeType = formData.get("mimeType");
    const fileSize = Number(formData.get("fileSize"));
    const chunkIndex = Number(formData.get("chunkIndex"));
    const totalChunks = Number(formData.get("totalChunks"));

    if (
      typeof fileId !== "string" ||
      typeof fileName !== "string" ||
      typeof mimeType !== "string" ||
      !Number.isFinite(fileSize) ||
      !Number.isInteger(chunkIndex) ||
      !Number.isInteger(totalChunks) ||
      chunkIndex < 0 ||
      totalChunks <= 0 ||
      chunkIndex >= totalChunks
    ) {
      return NextResponse.json({ error: "Invalid chunk metadata" }, { status: 400 });
    }

    const result = stageRelayChunk(
      key,
      fileId,
      chunkIndex,
      Buffer.from(await chunk.arrayBuffer()),
      { fileName, mimeType, fileSize, totalChunks },
    );

    return NextResponse.json({
      success: true,
      chunked: true,
      complete: result.complete,
      chunkIndex,
      totalChunks,
    });
  }

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

  appendRelayFiles(key, files);

  return NextResponse.json({ success: true, count: files.length });
}

// GET /api/relay/[code]
// Without ?index: returns JSON with file list + claimed flag.
// With ?index=N: downloads file at position N.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  sweepRelayEntries();
  const { code } = await params;
  const key = code.toUpperCase();
  const entry = getRelayEntry(key);

  if (!entry || entry.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Not found", files: [], claimed: false }, { status: 404 });
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
      claimed: entry.claimed,
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
  deleteRelayEntry(code.toUpperCase());
  return NextResponse.json({ success: true });
}
