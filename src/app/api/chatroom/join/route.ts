import { NextRequest, NextResponse } from 'next/server'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

type ChatRoomMetadata = {
  kind?: 'chatroom'
  passwordHash?: string | null
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
    const rooms = await svc.listRooms([roomName])
    const room = rooms[0]

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
    }

    const metadata = room.metadata ? JSON.parse(room.metadata) as ChatRoomMetadata : {}
    if (metadata.passwordHash && metadata.passwordHash !== (passwordHash || null)) {
      return NextResponse.json({ error: 'Wrong password.' }, { status: 403 })
    }

    const identity = `chat-user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const token = new AccessToken(config.apiKey, config.apiSecret, {
      identity,
      ttl: '4h',
      metadata: JSON.stringify({ role: 'participant', username }),
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
    console.error('[ChatRoom] Join error:', error)
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }
}
