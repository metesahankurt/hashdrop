import { NextRequest, NextResponse } from 'next/server'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

export async function POST(req: NextRequest) {
  const { roomName, username } = await req.json()

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const livekitUrl = process.env.LIVEKIT_URL

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json({ error: 'Conference service not configured. Set LIVEKIT_* env vars.' }, { status: 503 })
  }

  try {
    const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret)
    await svc.createRoom({
      name: roomName,
      maxParticipants: 50,
      emptyTimeout: 600, // 10 min
      departureTimeout: 20,
    })

    const identity = `host-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: '4h',
      metadata: JSON.stringify({ role: 'host', username }),
    })
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    return NextResponse.json({ token: await at.toJwt(), identity, roomName })
  } catch (err) {
    console.error('[Conference] Create error:', err)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
