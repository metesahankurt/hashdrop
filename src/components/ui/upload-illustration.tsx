'use client'

import { motion } from 'framer-motion'

interface UploadIllustrationProps {
  className?: string
  isActive?: boolean
}

export function UploadIllustration({ className, isActive = false }: UploadIllustrationProps) {
  return (
    <div className={className}>
      <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
        {/* Dashed circle background - rotates when active */}
        <motion.circle
          cx="100"
          cy="100"
          r="85"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
          animate={isActive ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Central cloud shape + upload arrow */}
        <motion.g
          animate={isActive ? { y: -5 } : { y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Larger, better proportioned cloud - optically centered (slightly up-left) */}
          <path
            d="M52 96 Q52 73 74 73 Q74 51 97 51 Q120 51 120 73 Q142 73 142 96 Q142 119 120 119 L74 119 Q52 119 52 96"
            fill="#3ECF8E"
            opacity="0.15"
          />

          {/* Upload arrow - bounces when active */}
          <motion.g
            animate={isActive ? { y: [0, -8, 0] } : { y: 0 }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Arrow line - optically centered */}
            <line
              x1="97"
              y1="111"
              x2="97"
              y2="69"
              stroke="#3ECF8E"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Arrow head - optically centered */}
            <polyline
              points="84,81 97,69 110,81"
              stroke="#3ECF8E"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </motion.g>
        </motion.g>

        {/* Floating particles - only visible when active */}
        {isActive && (
          <>
            <motion.circle
              cx="50"
              cy="55"
              r="3"
              fill="#3ECF8E"
              opacity="0.5"
              animate={{ opacity: [0, 0.5, 0], y: [0, -25, -50] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="155"
              cy="65"
              r="2.5"
              fill="#3ECF8E"
              opacity="0.6"
              animate={{ opacity: [0, 0.6, 0], y: [0, -20, -40] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.7 }}
            />
            <motion.circle
              cx="75"
              cy="155"
              r="3.5"
              fill="#3ECF8E"
              opacity="0.4"
              animate={{ opacity: [0, 0.4, 0], y: [0, -22, -44] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 1.3 }}
            />
          </>
        )}
      </svg>
    </div>
  )
}
