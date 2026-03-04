"use client"

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  code: string
  size?: number
  url?: string
}

export function QRCodeDisplay({ code, size = 200, url }: QRCodeDisplayProps) {
  const transferUrl = url || `https://hashdrop.metesahankurt.cloud?code=${code}`

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col items-center gap-2">
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
    </div>
  )
}
