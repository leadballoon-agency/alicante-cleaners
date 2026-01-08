import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

// Initialize GA4 client - uses GOOGLE_APPLICATION_CREDENTIALS env var
let analyticsClient: BetaAnalyticsDataClient | null = null

function getAnalyticsClient() {
  if (!analyticsClient) {
    // Check if we have service account credentials
    const credentials = process.env.GA4_SERVICE_ACCOUNT_JSON
    if (credentials) {
      try {
        const parsed = JSON.parse(credentials)
        analyticsClient = new BetaAnalyticsDataClient({
          credentials: {
            client_email: parsed.client_email,
            private_key: parsed.private_key,
          },
          projectId: parsed.project_id,
        })
      } catch {
        console.error('Failed to parse GA4 service account credentials')
        return null
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use file-based credentials
      analyticsClient = new BetaAnalyticsDataClient()
    }
  }
  return analyticsClient
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get GA4 Property ID from settings
    const settings = await db.platformSettings.findUnique({
      where: { id: 'default' },
      select: { ga4PropertyId: true },
    })

    if (!settings?.ga4PropertyId) {
      return NextResponse.json({
        configured: false,
        message: 'GA4 Property ID not configured',
      })
    }

    const client = getAnalyticsClient()
    if (!client) {
      return NextResponse.json({
        configured: false,
        message: 'GA4 API credentials not configured. Set GA4_SERVICE_ACCOUNT_JSON environment variable.',
      })
    }

    const propertyId = settings.ga4PropertyId

    // Fetch real-time data
    const [activeUsersResponse, pageViewsResponse] = await Promise.all([
      // Real-time active users
      client.runRealtimeReport({
        property: `properties/${propertyId}`,
        metrics: [{ name: 'activeUsers' }],
      }),
      // Real-time page views by page
      client.runRealtimeReport({
        property: `properties/${propertyId}`,
        dimensions: [
          { name: 'unifiedScreenName' },
          { name: 'country' },
        ],
        metrics: [{ name: 'activeUsers' }],
        limit: 10,
      }),
    ])

    // Parse active users
    const activeUsers = activeUsersResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || '0'

    // Parse pages data
    const pages = pageViewsResponse[0]?.rows?.map((row) => ({
      page: row.dimensionValues?.[0]?.value || 'Unknown',
      country: row.dimensionValues?.[1]?.value || 'Unknown',
      activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
    })) || []

    // Get country breakdown
    const countryMap = new Map<string, number>()
    pages.forEach((p) => {
      const count = countryMap.get(p.country) || 0
      countryMap.set(p.country, count + p.activeUsers)
    })
    const countries = Array.from(countryMap.entries())
      .map(([country, users]) => ({ country, users }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 5)

    // Get page breakdown (aggregate by page)
    const pageMap = new Map<string, number>()
    pages.forEach((p) => {
      const count = pageMap.get(p.page) || 0
      pageMap.set(p.page, count + p.activeUsers)
    })
    const topPages = Array.from(pageMap.entries())
      .map(([page, users]) => ({ page, users }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 5)

    return NextResponse.json({
      configured: true,
      realtime: {
        activeUsers: parseInt(activeUsers, 10),
        topPages,
        countries,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching GA4 realtime data:', error)

    // Check for specific GA4 errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('PERMISSION_DENIED')) {
      return NextResponse.json({
        configured: false,
        message: 'Service account does not have access to this GA4 property',
      })
    }

    if (errorMessage.includes('NOT_FOUND')) {
      return NextResponse.json({
        configured: false,
        message: 'GA4 property not found. Check your Property ID.',
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch GA4 data', details: errorMessage },
      { status: 500 }
    )
  }
}
