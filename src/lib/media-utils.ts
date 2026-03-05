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
