import JSZip from 'jszip'

export async function createZipFromFiles(files: File[]): Promise<File> {
  const zip = new JSZip()

  // Add all files to zip
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    zip.file(file.name, arrayBuffer)
  }

  // Generate zip blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6 // Balanced compression (1-9, 9 is best but slowest)
    }
  })

  // Create File object from blob
  const zipFile = new File(
    [zipBlob],
    `hashdrop-${Date.now()}.zip`,
    { type: 'application/zip' }
  )

  return zipFile
}

export function shouldZipFiles(files: File[]): boolean {
  // Always zip if multiple files
  return files.length > 1
}
