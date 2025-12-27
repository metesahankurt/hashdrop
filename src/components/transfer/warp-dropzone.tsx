"use client"

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { File, X } from 'lucide-react'
import { useWarpStore } from '@/store/use-warp-store'
import { cn } from '@/lib/utils'
import { UploadIllustration } from '@/components/ui/upload-illustration'

export function WarpDropzone() {
  const { file, setFile, setMode, status } = useWarpStore()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setMode('send')
    }
  }, [setFile, setMode])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: status !== 'idle' && status !== 'ready'
  })

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setMode(null)
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!file ? (
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
                  {isDragActive ? "Drop it here" : "Choose a file"}
                </h2>
                <p className="text-sm text-muted">
                  or drag and drop
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
            key="file-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative glass-card rounded-xl p-4 border-primary/30 glow-primary"
          >
            <div className="flex items-center gap-3">

              {/* Compact file icon */}
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <File className="w-6 h-6 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground truncate mb-0.5">
                  {file.name}
                </h3>
                <p className="text-sm text-muted">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {status === 'idle' && (
                <button
                  onClick={clearFile}
                  className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
