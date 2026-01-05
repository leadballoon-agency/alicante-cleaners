import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'Your villa, ready when you are'
  const subtitle = searchParams.get('subtitle') || 'Trusted cleaners for villa owners in Alicante, Spain'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFF8F5 0%, #FAFAF8 50%, #FFF8F5 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: '#C4785A',
          }}
        />

        {/* Villa icons decoration */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 80,
            display: 'flex',
            gap: '16px',
            opacity: 0.3,
          }}
        >
          <span style={{ fontSize: 48 }}>🏠</span>
          <span style={{ fontSize: 48 }}>🌴</span>
          <span style={{ fontSize: 48 }}>☀️</span>
        </div>

        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: '#C4785A',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 20,
            }}
          >
            <span style={{ fontSize: 40, color: 'white' }}>🏡</span>
          </div>
          <span
            style={{
              fontSize: 56,
              fontWeight: 600,
              color: '#C4785A',
            }}
          >
            VillaCare
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#1A1A1A',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.2,
            marginBottom: 24,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: '#6B6B6B',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          {subtitle}
        </div>

        {/* Trust badges */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: 48,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              padding: '12px 20px',
              borderRadius: 50,
              border: '2px solid #EBEBEB',
            }}
          >
            <span style={{ fontSize: 24 }}>📸</span>
            <span style={{ fontSize: 20, color: '#1A1A1A', fontWeight: 500 }}>Photo proof</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              padding: '12px 20px',
              borderRadius: 50,
              border: '2px solid #EBEBEB',
            }}
          >
            <span style={{ fontSize: 24 }}>🌍</span>
            <span style={{ fontSize: 20, color: '#1A1A1A', fontWeight: 500 }}>Auto-translate</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              padding: '12px 20px',
              borderRadius: 50,
              border: '2px solid #EBEBEB',
            }}
          >
            <span style={{ fontSize: 24 }}>✅</span>
            <span style={{ fontSize: 20, color: '#1A1A1A', fontWeight: 500 }}>Vetted cleaners</span>
          </div>
        </div>

        {/* Bottom decoration */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: 18, color: '#9B9B9B' }}>alicantecleaners.com</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
