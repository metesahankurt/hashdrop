export function isImageFile(file: File): boolean {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  return imageTypes.includes(file.type)
}

export function createImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

export function revokeImagePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}

export function getFileIcon(file: File): string {
  if (isImageFile(file)) return '🖼️'
  if (file.type.includes('pdf')) return '📄'
  if (file.type.includes('video')) return '🎬'
  if (file.type.includes('audio')) return '🎵'
  if (file.type.includes('zip') || file.type.includes('compressed')) return '📦'
  if (file.type.includes('text')) return '📝'
  return '📎'
}
