import { NextRequest, NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'

export async function GET(req: NextRequest) {
  const roomName = req.nextUrl.searchParams.get('roomName')

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const livekitUrl = process.env.LIVEKIT_URL

  if (!roomName) {
    return NextResponse.json({ error: 'roomName is required' }, { status: 400 })
  }

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json({ error: 'Conference service not configured.' }, { status: 503 })
  }

  try {
    const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret)
    const participants = await svc.listParticipants(roomName)

    const waiting = participants
      .map((participant) => {
        let username = participant.identity
        let role = ''

        try {
          const metadata = JSON.parse(participant.metadata || '{}') as {
            username?: string
            role?: string
          }
          username = metadata.username || username
          role = metadata.role || ''
        } catch {
          role = ''
        }

        return {
          identity: participant.identity,
          username,
          role,
        }
      })
      .filter((participant) => participant.role === 'waiting')

    return NextResponse.json({ participants: waiting })
  } catch (error) {
    console.error('[Conference] Waiting list error:', error)
    return NextResponse.json({ error: 'Failed to load waiting participants' }, { status: 500 })
  }
}
