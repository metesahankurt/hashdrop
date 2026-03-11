import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'

export async function POST(req: NextRequest) {
  const { roomName, participantIdentity, username } = await req.json()

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const livekitUrl = process.env.LIVEKIT_URL

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  try {
    const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret)
    await svc.updateParticipant(roomName, participantIdentity, {
      metadata: JSON.stringify({ role: 'participant', username }),
      permission: {
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Conference] Admit error:', err)
    return NextResponse.json({ error: 'Failed to admit participant' }, { status: 500 })
  }
}
