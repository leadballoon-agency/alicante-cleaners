import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// Note: Using nodejs runtime for Prisma compatibility
// For edge runtime, you'd need Prisma Data Proxy or direct fetch

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Fetch cleaner data
  const cleaner = await db.cleaner.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  })

  if (!cleaner) {
    // Return a generic VillaCare OG image if cleaner not found
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1A1A1A',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            VillaCare
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#C4785A',
              marginTop: 20,
            }}
          >
            Cleaner not found
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }

  const name = cleaner.user.name || 'Cleaner'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'
  // Convert relative image paths to absolute URLs
  const photo = cleaner.user.image
    ? cleaner.user.image.startsWith('http')
      ? cleaner.user.image
      : `${baseUrl}${cleaner.user.image}`
    : null
  const rating = Number(cleaner.rating) || 0
  const reviewCount = cleaner.reviewCount || 0
  const areas = cleaner.serviceAreas || []
  const hourlyRate = Number(cleaner.hourlyRate) || 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1A1A1A',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Terracotta accent bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: '#C4785A',
          }}
        />

        {/* Terracotta accent corner decoration */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 200,
            height: 200,
            background: 'linear-gradient(135deg, transparent 50%, rgba(196, 120, 90, 0.3) 50%)',
          }}
        />

        {/* Logo area - top right */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 50,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${baseUrl}/villacare-horizontal-logo.png`}
            alt="VillaCare"
            style={{
              height: 50,
            }}
          />
        </div>

        {/* Main content area */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '80px 50px 50px 50px',
            gap: 40,
          }}
        >
          {/* Profile image - left side */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: 24,
                border: '4px solid #C4785A',
                backgroundColor: '#2A2A2A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo}
                  alt={name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 72,
                    color: '#6B6B6B',
                  }}
                >
                  👤
                </div>
              )}
            </div>
          </div>

          {/* Text content - right side */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            {/* Name */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.1,
                marginBottom: 20,
              }}
            >
              {name}
            </div>

            {/* Tagline */}
            <div
              style={{
                fontSize: 32,
                color: '#C4785A',
                marginBottom: 30,
              }}
            >
              Professional Villa Cleaner
            </div>

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                gap: 40,
                marginBottom: 30,
              }}
            >
              {/* Rating */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 32, color: '#C4785A' }}>★</span>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  {rating.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: 24,
                    color: '#9B9B9B',
                  }}
                >
                  ({reviewCount} reviews)
                </span>
              </div>

              {/* Rate */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 600,
                    color: '#C4785A',
                  }}
                >
                  €{hourlyRate}/hr
                </span>
              </div>
            </div>

            {/* Areas */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              {areas.slice(0, 4).map((area) => (
                <div
                  key={area}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    padding: '10px 20px',
                    borderRadius: 50,
                    fontSize: 20,
                  }}
                >
                  {area}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA - bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            right: 50,
            backgroundColor: '#C4785A',
            color: '#FFFFFF',
            padding: '16px 32px',
            borderRadius: 16,
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          Book Now on VillaCare
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
