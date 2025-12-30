import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get('code');

  // SECURITY: Validate and sanitize code parameter
  let code: string | null = null;
  if (rawCode) {
    // Only allow alphanumeric and hyphens, max 50 chars
    const sanitized = rawCode.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50);
    // Validate format: Word-Word
    if (/^[A-Za-z]+-[A-Za-z]+$/.test(sanitized)) {
      code = sanitized;
    }
  }

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
          background: '#0D0D0D',
          position: 'relative',
        }}
      >
        {/* Main gradient - matching site style */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 1400px 1000px at 50% 0%, rgba(62, 207, 142, 0.10) 0%, rgba(62, 207, 142, 0.04) 40%, transparent 80%)',
          }}
        />

        {/* Subtle accent orb */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(62, 207, 142, 0.08), transparent 70%)',
            bottom: '-100px',
            left: '-100px',
          }}
        />

        {isTransferShare ? (
          // Transfer code view - Clean and centered
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '48px',
            }}
          >
            {/* Logo and branding - top */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '56px',
                  height: '56px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 20 C 140 60, 170 100, 170 130 C 170 165, 138 180, 100 180 C 62 180, 30 165, 30 130 C 30 100, 60 60, 100 20 Z"
                    fill="#3ECF8E"
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    fontSize: '32px',
                    fontWeight: 900,
                    color: 'white',
                    marginTop: '4px',
                  }}
                >
                  #
                </div>
              </div>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                HashDrop
              </div>
            </div>

            {/* Main content - transfer code */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                padding: '64px 80px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 500,
                }}
              >
                Transfer Code
              </div>

              <div
                style={{
                  fontSize: '72px',
                  fontWeight: 900,
                  color: '#3ECF8E',
                  letterSpacing: '-0.02em',
                }}
              >
                {code}
              </div>

              <div
                style={{
                  fontSize: '20px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: 500,
                }}
              >
                Click to join transfer
              </div>
            </div>

            {/* Bottom badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '100px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3ECF8E',
                }}
              />
              <span
                style={{
                  fontSize: '16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                }}
              >
                Secure P2P Transfer
              </span>
            </div>
          </div>
        ) : (
          // Default brand view - Clean and simple
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '40px',
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: 'flex',
                width: '120px',
                height: '120px',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <svg
                width="120"
                height="120"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 20 C 140 60, 170 100, 170 130 C 170 165, 138 180, 100 180 C 62 180, 30 165, 30 130 C 30 100, 60 60, 100 20 Z"
                  fill="#3ECF8E"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  fontSize: '72px',
                  fontWeight: 900,
                  color: 'white',
                  marginTop: '8px',
                }}
              >
                #
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '72px',
                  fontWeight: 900,
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                HashDrop
              </div>
              <div
                style={{
                  fontSize: '28px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                }}
              >
                Secure P2P File Transfer
              </div>
            </div>

            {/* Features */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginTop: '16px',
              }}
            >
              {['No Cloud', 'No Limits', 'Encrypted'].map((feature) => (
                <div
                  key={feature}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#3ECF8E',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '18px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 500,
                    }}
                  >
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
