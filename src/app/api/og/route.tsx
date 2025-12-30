import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  const response = new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%)',
          position: 'relative',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Gradient orbs for depth */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo - Drop with # */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px',
              position: 'relative',
              width: '120px',
              height: '120px',
            }}
          >
            {/* Drop shape background */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
              }}
            >
              <defs>
                <linearGradient id="dropGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <path
                d="M100 20 C 140 60, 170 100, 170 130 C 170 165, 138 180, 100 180 C 62 180, 30 165, 30 130 C 30 100, 60 60, 100 20 Z"
                fill="url(#dropGradient)"
                opacity="0.95"
              />
            </svg>
            {/* # symbol as HTML */}
            <div
              style={{
                display: 'flex',
                fontSize: '72px',
                fontWeight: 900,
                color: 'white',
                position: 'relative',
                marginTop: '8px',
              }}
            >
              #
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              background: 'linear-gradient(90deg, #ffffff 0%, #e5e5e5 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '16px',
              letterSpacing: '-0.025em',
            }}
          >
            HashDrop
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '32px',
              fontWeight: 500,
              textAlign: 'center',
              maxWidth: '700px',
            }}
          >
            Secure P2P File Transfer
          </div>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: '32px',
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                }}
              />
              <span>No Cloud</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                }}
              />
              <span>No Limits</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                }}
              />
              <span>WebRTC Powered</span>
            </div>
          </div>

          {/* Bottom badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '2px solid rgba(34, 197, 94, 0.5)',
              }}
            />
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, max-age=604800',
        'Vercel-CDN-Cache-Control': 'public, max-age=604800',
      },
    }
  );

  return response;
}
