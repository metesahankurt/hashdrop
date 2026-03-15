import { NextRequest, NextResponse } from "next/server";
import {
  getRelayEntry,
  setRelayEntry,
  sweepRelayEntries,
  TTL_MS,
} from "../../store";

// POST /api/relay/[code]/claim
// Called by the web receiver when they enter a code.
// Creates a pending entry so the mobile sender knows to start uploading.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  sweepRelayEntries();
  const { code } = await params;
  const key = code.toUpperCase();
  const existing = getRelayEntry(key);

  if (existing && existing.expiresAt > Date.now()) {
    existing.claimed = true;
    setRelayEntry(key, existing);
  } else {
    setRelayEntry(key, {
      files: [],
      expiresAt: Date.now() + TTL_MS,
      claimed: true,
    });
  }

  return NextResponse.json({ success: true });
}

// GET /api/relay/[code]/claim
// Polled by mobile to check if a receiver has claimed this code.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  sweepRelayEntries();
  const { code } = await params;
  const key = code.toUpperCase();
  const entry = getRelayEntry(key);

  if (!entry || entry.expiresAt < Date.now()) {
    return NextResponse.json({ claimed: false });
  }

  return NextResponse.json({ claimed: entry.claimed });
}
