import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Vercel Cron job to clean up old rate limit entries
// Schedule: Daily at 3am UTC (configured in vercel.json)

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (Vercel sets this header)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // In production, require either Vercel's cron header or a secret
    if (process.env.NODE_ENV === 'production') {
      const isVercelCron = request.headers.get('x-vercel-cron') === '1'
      const isValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

      if (!isVercelCron && !isValidSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Delete entries older than 24 hours
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const result = await db.rateLimitEntry.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })

    console.log(`[Cron] Cleaned up ${result.count} rate limit entries older than 24h`)

    return NextResponse.json({
      success: true,
      deleted: result.count,
      cutoff: cutoffDate.toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Rate limit cleanup failed:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
