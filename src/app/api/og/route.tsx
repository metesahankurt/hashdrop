import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Determine if this is a transfer-specific share or general brand share
  const isTransferShare = !!code;

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
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f1419 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated mesh gradient background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.12) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(5, 150, 105, 0.08) 0%, transparent 60%)',
          }}
        />

        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Glow orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '5%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />

        {/* Main content card with glassmorphism */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            padding: '80px 100px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          {isTransferShare ? (
            // Transfer-specific design
            <>
              {/* Small badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '24px',
                  padding: '8px 20px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  borderRadius: '100px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 12px rgba(34, 197, 94, 0.8)',
                  }}
                />
                <span
                  style={{
                    fontSize: '16px',
                    color: '#4ade80',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                  }}
                >
                  ACTIVE TRANSFER
                </span>
              </div>

              {/* Transfer code - Large and prominent */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '32px',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '12px',
                    fontWeight: 500,
                  }}
                >
                  Transfer Code
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: '84px',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #ffffff 0%, #4ade80 100%)',
                    backgroundClip: 'text',
                    color: 'transparent',
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 40px rgba(74, 222, 128, 0.3)',
                  }}
                >
                  {code}
                </div>
              </div>

              {/* HashDrop branding - smaller */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '24px',
                }}
              >
                {/* Mini logo */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    width: '48px',
                    height: '48px',
                  }}
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ position: 'absolute' }}
                  >
                    <defs>
                      <linearGradient id="miniDrop" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M100 20 C 140 60, 170 100, 170 130 C 170 165, 138 180, 100 180 C 62 180, 30 165, 30 130 C 30 100, 60 60, 100 20 Z"
                      fill="url(#miniDrop)"
                    />
                  </svg>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: 'white', position: 'relative' }}>
                    #
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1,
                    }}
                  >
                    HashDrop
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: '4px',
                    }}
                  >
                    Secure P2P Transfer
                  </div>
                </div>
              </div>

              {/* Call to action */}
              <div
                style={{
                  display: 'flex',
                  marginTop: '32px',
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.15) 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <span
                  style={{
                    fontSize: '18px',
                    color: '#4ade80',
                    fontWeight: 600,
                  }}
                >
                  Click to join this transfer
                </span>
              </div>
            </>
          ) : (
            // General brand design
            <>
              {/* Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '40px',
                  position: 'relative',
                  width: '140px',
                  height: '140px',
                }}
              >
                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ position: 'absolute' }}
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
                <div
                  style={{
                    display: 'flex',
                    fontSize: '84px',
                    fontWeight: 900,
                    color: 'white',
                    position: 'relative',
                    marginTop: '12px',
                  }}
                >
                  #
                </div>
              </div>

              {/* Title */}
              <div
                style={{
                  display: 'flex',
                  fontSize: '88px',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  marginBottom: '20px',
                  letterSpacing: '-0.03em',
                }}
              >
                HashDrop
              </div>

              {/* Subtitle */}
              <div
                style={{
                  fontSize: '32px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '40px',
                  fontWeight: 600,
                }}
              >
                Secure P2P File Transfer
              </div>

              {/* Features grid */}
              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                  marginTop: '8px',
                }}
              >
                {['No Cloud', 'No Limits', 'WebRTC'].map((feature) => (
                  <div
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 24px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        boxShadow: '0 0 12px rgba(34, 197, 94, 0.6)',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '20px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontWeight: 600,
                      }}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Security badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '40px',
                  padding: '12px 28px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '100px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.25)',
                    border: '2px solid #22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '18px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 500,
                  }}
                >
                  End-to-end encrypted
                </span>
              </div>
            </>
          )}
        </div>

        {/* Subtle corner accents */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '200px',
            height: '200px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '200px',
            height: '200px',
            background: 'linear-gradient(315deg, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
          }}
        />
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
