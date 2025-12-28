"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { X, Download } from 'lucide-react'

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  fileName: string
  fileSize?: number
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, fileName, fileSize }: ImagePreviewModalProps) {
  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = fileName
    a.click()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }}
          >
            {/* Centered Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] glass-card border border-border z-[70] rounded-xl md:rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/30">
                <div className="flex-1 min-w-0 mr-4">
                  <h2 className="text-lg md:text-xl font-semibold truncate">{fileName}</h2>
                  {fileSize && (
                    <p className="text-xs md:text-sm text-muted">
                      {(fileSize / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Image Container */}
              <div className="flex-1 overflow-auto p-4 md:p-6 flex items-center justify-center bg-black/20">
                <img
                  src={imageUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
