const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
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

let cachedIceServers: RTCIceServer[] | null = null
let iceServersPromise: Promise<RTCIceServer[]> | null = null

export function getDefaultIceServers(): RTCIceServer[] {
  return DEFAULT_ICE_SERVERS
}

export function getIceTransportPolicy(): RTCIceTransportPolicy {
  return 'relay'
}

export async function getIceServers(): Promise<RTCIceServer[]> {
  if (cachedIceServers) {
    return cachedIceServers
  }

  if (!iceServersPromise) {
    iceServersPromise = fetch('/api/webrtc/ice-servers', {
      method: 'GET',
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`ICE server request failed with ${response.status}`)
        }

        const payload = await response.json() as { iceServers?: RTCIceServer[] }
        if (!Array.isArray(payload.iceServers) || payload.iceServers.length === 0) {
          throw new Error('ICE server response was empty')
        }

        cachedIceServers = payload.iceServers
        return payload.iceServers
      })
      .catch((error) => {
        console.warn('[WebRTC] Falling back to default ICE servers', error)
        cachedIceServers = DEFAULT_ICE_SERVERS
        return DEFAULT_ICE_SERVERS
      })
      .finally(() => {
        iceServersPromise = null
      })
  }

  return iceServersPromise
}
