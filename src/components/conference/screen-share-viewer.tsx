'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client'
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react'
import { clsx } from 'clsx'

type VideoTrack = LocalVideoTrack | RemoteVideoTrack

interface ScreenShareViewerProps {
  track: VideoTrack
  presenterName: string
  isExpanded: boolean
  onToggleExpand: () => void
}

export function ScreenShareViewer({ track, presenterName, isExpanded, onToggleExpand }: ScreenShareViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const bgVideoRef = useRef<HTMLVideoElement>(null)
  const minimapRef = useRef<HTMLVideoElement>(null)

  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dims, setDims] = useState({ w: 1, h: 1 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const isZoomed = scale > 1.01

  // Attach track to all three video elements
  useEffect(() => {
    if (!track) return
    const els = [videoRef.current, bgVideoRef.current, minimapRef.current].filter(
      (el): el is HTMLVideoElement => el !== null
    )
    els.forEach((el) => track.attach(el))
    return () => {
      els.forEach((el) => track.detach(el))
    }
  }, [track])

  // Track container size for clamping
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect
      setDims({ w: r.width || 1, h: r.height || 1 })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const clamp = useCallback(
    (ox: number, oy: number, s: number, w: number, h: number) => {
      if (s <= 1) return { x: 0, y: 0 }
      const mx = (w * (s - 1)) / 2
      const my = (h * (s - 1)) / 2
      return {
        x: Math.max(-mx, Math.min(mx, ox)),
        y: Math.max(-my, Math.min(my, oy)),
      }
    },
    []
  )

  // Mouse wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setScale((s) => {
        const next = Math.max(1, Math.min(5, s * (e.deltaY < 0 ? 1.1 : 0.9)))
        return +next.toFixed(3)
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Re-clamp when scale or dims change
  useEffect(() => {
    setOffset((p) => clamp(p.x, p.y, scale, dims.w, dims.h))
  }, [scale, dims, clamp])

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setDragging(true)
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
    e.preventDefault()
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const nx = e.clientX - dragStart.current.x
    const ny = e.clientY - dragStart.current.y
    setOffset(clamp(nx, ny, scale, dims.w, dims.h))
  }

  const onMouseUp = () => setDragging(false)

  const onDblClick = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  // Minimap viewport rect (0-1 normalized)
  const mmLeft = Math.max(0, Math.min(1 - 1 / scale, 0.5 - (0.5 + offset.x / dims.w) / scale))
  const mmTop  = Math.max(0, Math.min(1 - 1 / scale, 0.5 - (0.5 + offset.y / dims.h) / scale))
  const mmW    = 1 / scale
  const mmH    = 1 / scale

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden group border border-white/10">
      {/* Blurred background — fills the letterbox areas */}
      <video
        ref={bgVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60 pointer-events-none"
      />

      {/* Zoomable main video */}
      <div
        ref={containerRef}
        className={clsx(
          'absolute inset-0 overflow-hidden select-none',
          isZoomed ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        )}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onDoubleClick={onDblClick}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: dragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {/* Presenter label */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg pointer-events-none">
        <span>{presenterName} is sharing their screen</span>
        {isZoomed && (
          <span className="text-primary font-semibold">{Math.round(scale * 100)}%</span>
        )}
      </div>

      {/* Top-right controls (visible on hover) */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setScale((s) => Math.min(5, +(s * 1.3).toFixed(2)))
          }}
          className="p-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg hover:bg-black/80 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        {isZoomed && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setScale(1)
              setOffset({ x: 0, y: 0 })
            }}
            className="p-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg hover:bg-black/80 transition-colors"
            title="Reset zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className="p-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg hover:bg-black/80 transition-colors"
          title={isExpanded ? 'Show participants' : 'Expand'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Zoom hint (shown on hover when not zoomed) */}
      {!isZoomed && (
        <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-black/40 backdrop-blur-sm text-white/50 text-[10px] px-2 py-1 rounded-lg whitespace-nowrap">
          Scroll to zoom · Drag to pan · Double-click to reset
        </div>
      )}

      {/* Minimap — only when zoomed */}
      {isZoomed && (
        <div className="absolute bottom-10 right-3 z-20 w-[180px] h-[101px] rounded-lg overflow-hidden border border-white/20 shadow-2xl bg-black/80">
          <video
            ref={minimapRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
          {/* Viewport indicator with dimming outside */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute rounded-[2px] border-2 border-primary"
              style={{
                left: `${mmLeft * 100}%`,
                top: `${mmTop * 100}%`,
                width: `${mmW * 100}%`,
                height: `${mmH * 100}%`,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
