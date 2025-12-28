"use client"

import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'

interface QRCodeDisplayProps {
  code: string
  size?: number
}

export function QRCodeDisplay({ code, size = 200 }: QRCodeDisplayProps) {
  // Generate full URL for QR code
  const transferUrl = `https://hashdrop.metesahankurt.cloud?code=${code}`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-4 rounded-xl flex flex-col items-center gap-2"
    >
      <div className="bg-white p-2 rounded-lg">
        <QRCodeSVG
          value={transferUrl}
          size={size}
          level="H"
          bgColor="#ffffff"
          fgColor="#000000"
          includeMargin={false}
        />
      </div>
      <p className="text-xs text-muted text-center">
        Scan to connect
      </p>
    </motion.div>
  )
}
