import { NextRequest, NextResponse } from 'next/server'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

type ChatRoomMetadata = {
  kind: 'chatroom'
  passwordHash: string | null
}

function getLiveKitConfig() {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const livekitUrl = process.env.LIVEKIT_URL

  if (!apiKey || !apiSecret || !livekitUrl) {
    return null
  }

  return { apiKey, apiSecret, livekitUrl }
}

export async function POST(req: NextRequest) {
  const { roomName, username, passwordHash } = await req.json()
  const config = getLiveKitConfig()

  if (!config) {
    return NextResponse.json({ error: 'Chat service not configured. Set LIVEKIT_* env vars.' }, { status: 503 })
  }

  try {
    const svc = new RoomServiceClient(config.livekitUrl, config.apiKey, config.apiSecret)
    const existingRooms = await svc.listRooms([roomName])
    if (existingRooms.length > 0) {
      return NextResponse.json({ error: 'This code is already in use, try again.' }, { status: 409 })
    }

    const metadata: ChatRoomMetadata = {
      kind: 'chatroom',
      passwordHash: passwordHash || null,
    }

    await svc.createRoom({
      name: roomName,
      maxParticipants: 50,
      emptyTimeout: 600,
      departureTimeout: 30,
      metadata: JSON.stringify(metadata),
    })

    const identity = `chat-host-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const token = new AccessToken(config.apiKey, config.apiSecret, {
      identity,
      ttl: '4h',
      metadata: JSON.stringify({ role: 'host', username }),
    })

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    return NextResponse.json({
      token: await token.toJwt(),
      identity,
      roomName,
    })
  } catch (error) {
    console.error('[ChatRoom] Create error:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
