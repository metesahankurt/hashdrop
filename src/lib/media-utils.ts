export async function getLocalMediaStream(
  video: boolean = true,
  audio: boolean = true
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: video ? {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      // Support portrait (mobile) — browser picks orientation automatically
      aspectRatio: { ideal: 16 / 9 },
      facingMode: 'user'
    } : false,
    audio: audio ? {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    } : false
  })
}

export type MediaFallbackResult = {
  stream: MediaStream
  hasVideo: boolean
  hasAudio: boolean
}

export async function getLocalMediaStreamWithFallback(): Promise<MediaFallbackResult> {
  // Try video + audio first
  try {
    const stream = await getLocalMediaStream(true, true)
    return {
      stream,
      hasVideo: stream.getVideoTracks().length > 0,
      hasAudio: stream.getAudioTracks().length > 0,
    }
  } catch (err) {
    const error = err as DOMException
    // If camera not found, fall back to audio-only
    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError' || error.name === 'NotReadableError') {
      try {
        const audioStream = await getLocalMediaStream(false, true)
        return {
          stream: audioStream,
          hasVideo: false,
          hasAudio: audioStream.getAudioTracks().length > 0,
        }
      } catch {
        // Both video+audio and audio-only failed
        throw new DOMException('No media devices available', 'NO_MEDIA_DEVICES')
      }
    }
    // Permission denied or other error — rethrow
    throw err
  }
}

export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
}

/**
 * Detect if a video track is portrait-oriented (height > width).
 */
export function isPortraitTrack(track: MediaStreamTrack | null): boolean {
  if (!track || track.kind !== 'video') return false
  const settings = track.getSettings()
  if (settings.width && settings.height) {
    return settings.height > settings.width
  }
  return false
}
