import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'

export async function POST(req: NextRequest) {
  const { roomName, participantIdentity } = await req.json()

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const livekitUrl = process.env.LIVEKIT_URL

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  try {
    const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret)
    await svc.removeParticipant(roomName, participantIdentity)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Conference] Deny error:', err)
    return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 })
  }
}
