import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function POST(req: NextRequest) {
  const { roomName, username } = await req.json()

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Conference service not configured.' }, { status: 503 })
  }

  const identity = `participant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    ttl: '4h',
    metadata: JSON.stringify({ role: 'waiting', username }),
  })
  // Waiting room: can only send data (join requests), cannot publish/subscribe tracks
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: false,
    canSubscribe: false,
    canPublishData: true,
  })

  return NextResponse.json({ token: await at.toJwt(), identity })
}
