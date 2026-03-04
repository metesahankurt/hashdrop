export async function getLocalMediaStream(
  video: boolean = true,
  audio: boolean = true
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: video ? {
      width: { ideal: 1280 },
      height: { ideal: 720 },
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
