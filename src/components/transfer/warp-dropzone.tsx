"use client"

import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { File, X, Image as ImageIcon } from 'lucide-react'
import { useWarpStore } from '@/store/use-warp-store'
import { cn } from '@/lib/utils'
import { UploadIllustration } from '@/components/ui/upload-illustration'
import { isImageFile, createImagePreviewUrl, revokeImagePreviewUrl } from '@/lib/file-utils'
import { ImagePreviewModal } from '@/components/ui/image-preview-modal'

export function WarpDropzone() {
  const { files, setFiles, setMode, status } = useWarpStore()
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({})
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null)

  // Create preview URLs for image files
  useEffect(() => {
    const urls: { [key: string]: string } = {}
    files.forEach((file, index) => {
      if (isImageFile(file)) {
        urls[`${file.name}-${index}`] = createImagePreviewUrl(file)
      }
    })
    setPreviewUrls(urls)

    // Cleanup URLs on unmount or when files change
    return () => {
      Object.values(urls).forEach(revokeImagePreviewUrl)
    }
  }, [files])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(acceptedFiles)
      setMode('send')
    }
  }, [setFiles, setMode])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: status !== 'idle' && status !== 'ready'
  })

  const clearFiles = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFiles([])
    setMode(null)
  }

  const removeFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    if (newFiles.length === 0) {
      setMode(null)
    }
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full"
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative group cursor-pointer rounded-xl glass-card-hover",
                "p-6 md:p-8 text-center",
                "border-2 border-dashed",
                isDragActive && "border-primary/50 bg-primary/5"
              )}
            >
            <input {...getInputProps()} />

            <div className="relative z-10 flex flex-col items-center gap-3 md:gap-4">

              {/* Compact Upload Illustration */}
              <UploadIllustration
                className="w-16 h-16 md:w-20 md:h-20"
                isActive={isDragActive}
              />

              {/* Compact Text */}
              <div className="space-y-1.5">
                <h2 className="text-lg md:text-xl font-semibold text-foreground">
                  {isDragActive ? "Drop files here" : "Choose files"}
                </h2>
                <p className="text-sm text-muted">
                  or drag and drop • multiple files supported
                </p>
              </div>
            </div>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(62,207,142,0.08)_0%,transparent_70%)]" />
            </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="files-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Header with total info */}
            <div className="flex items-center justify-between glass-card rounded-xl p-3 border-primary/30">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </h3>
                <p className="text-sm text-muted">
                  Total: {(totalSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {status === 'idle' && (
                <button
                  onClick={clearFiles}
                  className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Files list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file, index) => {
                const previewKey = `${file.name}-${index}`
                const previewUrl = previewUrls[previewKey]
                const isImage = isImageFile(file)

                return (
                  <motion.div
                    key={previewKey}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 glass-card rounded-lg p-3"
                  >
                    {/* Thumbnail or Icon */}
                    {isImage && previewUrl ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewFile({ file, url: previewUrl })
                        }}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-primary/20 flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
                      >
                        <img
                          src={previewUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                        {isImage ? (
                          <ImageIcon className="w-4 h-4 text-primary" />
                        ) : (
                          <File className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </h4>
                      <p className="text-xs text-muted">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>

                    {status === 'idle' && (
                      <button
                        onClick={(e) => removeFile(index, e)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-all flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        imageUrl={previewFile?.url || ''}
        fileName={previewFile?.file.name || ''}
        fileSize={previewFile?.file.size}
      />
    </div>
  )
}
