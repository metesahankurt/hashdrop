import { NextResponse } from 'next/server'

const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  {
    urls: [
      'turn:openrelay.metered.ca:80?transport=udp',
      'turn:openrelay.metered.ca:80?transport=tcp',
      'turn:openrelay.metered.ca:443?transport=tcp',
      'turns:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

function sanitizeMeteredDomain(input: string) {
  return input.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

export async function GET() {
  const meteredDomain = process.env.METERED_DOMAIN
  const meteredSecretKey = process.env.METERED_SECRET_KEY

  if (!meteredDomain || !meteredSecretKey) {
    return NextResponse.json({
      iceServers: FALLBACK_ICE_SERVERS,
      source: 'fallback',
      reason: 'missing-metered-env',
    })
  }

  const domain = sanitizeMeteredDomain(meteredDomain)

  try {
    const createCredentialResponse = await fetch(
      `https://${domain}/api/v1/turn/credential?secretKey=${encodeURIComponent(meteredSecretKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expiryInSeconds: 3600,
          label: 'hashdrop-web',
        }),
        cache: 'no-store',
      },
    )

    if (!createCredentialResponse.ok) {
      const errorText = await createCredentialResponse.text()
      throw new Error(`Credential creation failed: ${createCredentialResponse.status} ${errorText}`)
    }

    const createdCredential = await createCredentialResponse.json() as { apiKey?: string }
    if (!createdCredential.apiKey) {
      throw new Error('Metered credential response did not include apiKey')
    }

    const credentialsResponse = await fetch(
      `https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(createdCredential.apiKey)}`,
      {
        method: 'GET',
        cache: 'no-store',
      },
    )

    if (!credentialsResponse.ok) {
      const errorText = await credentialsResponse.text()
      throw new Error(`Credential fetch failed: ${credentialsResponse.status} ${errorText}`)
    }

    const iceServers = await credentialsResponse.json() as RTCIceServer[]
    if (!Array.isArray(iceServers) || iceServers.length === 0) {
      throw new Error('Metered returned an empty ICE server array')
    }

    return NextResponse.json({
      iceServers,
      source: 'metered',
    })
  } catch (error) {
    console.error('[ICE] Failed to load Metered ICE servers, using fallback', error)
    return NextResponse.json({
      iceServers: FALLBACK_ICE_SERVERS,
      source: 'fallback',
      reason: 'metered-request-failed',
    })
  }
}
