import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { processBookingReminders } from '@/lib/notifications/booking-notifications'

/**
 * Combined Daily Cron Job
 *
 * Runs at 8am UTC daily (configured in vercel.json)
 * Tasks:
 * 1. Process booking reminders
 * 2. Clean up old rate limit entries
 */

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
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

    const results: Record<string, unknown> = {}

    // Task 1: Process booking reminders
    try {
      const reminderResult = await processBookingReminders()
      results.reminders = { success: true, ...reminderResult }
      console.log('[Cron] Booking reminders processed:', reminderResult)
    } catch (error) {
      console.error('[Cron] Booking reminders failed:', error)
      results.reminders = { success: false, error: String(error) }
    }

    // Task 2: Clean up rate limit entries older than 24 hours
    try {
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const deleteResult = await db.rateLimitEntry.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      })
      results.rateLimitCleanup = { success: true, deleted: deleteResult.count }
      console.log(`[Cron] Cleaned up ${deleteResult.count} rate limit entries`)
    } catch (error) {
      console.error('[Cron] Rate limit cleanup failed:', error)
      results.rateLimitCleanup = { success: false, error: String(error) }
    }

    return NextResponse.json({
      success: true,
      tasks: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Daily tasks failed:', error)
    return NextResponse.json(
      { error: 'Daily tasks failed' },
      { status: 500 }
    )
  }
}
