import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { processBookingReminders } from '@/lib/notifications/booking-notifications'
import { syncAllTeamCalendars } from '@/lib/google-calendar'
import { processOwnerNurturing } from '@/lib/nurturing/owner-nurturing'
import { generateRecurringBookings } from '@/lib/recurring-bookings'

/**
 * Combined Daily Cron Job
 *
 * Runs at 8am UTC daily (configured in vercel.json)
 * Tasks:
 * 1. Process booking reminders
 * 2. Clean up old rate limit entries
 * 3. Sync team members' Google Calendars
 * 4. Process owner nurturing emails
 * 5. Generate recurring bookings (top up active series)
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

    // Task 3: Sync team members' Google Calendars
    try {
      const syncResult = await syncAllTeamCalendars()
      results.teamCalendarSync = {
        success: true,
        teamsProcessed: syncResult.teamsProcessed,
        membersProcessed: syncResult.membersProcessed,
        membersSynced: syncResult.membersSynced,
        errors: syncResult.errors.length,
      }
      console.log(`[Cron] Team calendar sync: ${syncResult.membersSynced}/${syncResult.membersProcessed} members synced across ${syncResult.teamsProcessed} teams`)
      if (syncResult.errors.length > 0) {
        console.warn('[Cron] Team calendar sync errors:', syncResult.errors)
      }
    } catch (error) {
      console.error('[Cron] Team calendar sync failed:', error)
      results.teamCalendarSync = { success: false, error: String(error) }
    }

    // Task 4: Process owner nurturing emails
    try {
      const nurturingResult = await processOwnerNurturing()
      results.ownerNurturing = {
        success: true,
        profileNudges: nurturingResult.profileNudges,
        bookingPrompts: nurturingResult.bookingPrompts,
        reEngagements: nurturingResult.reEngagements,
        errors: nurturingResult.errors.length,
      }
      console.log(`[Cron] Owner nurturing: ${nurturingResult.profileNudges} profile nudges, ${nurturingResult.bookingPrompts} booking prompts, ${nurturingResult.reEngagements} re-engagements`)
      if (nurturingResult.errors.length > 0) {
        console.warn('[Cron] Owner nurturing errors:', nurturingResult.errors)
      }
    } catch (error) {
      console.error('[Cron] Owner nurturing failed:', error)
      results.ownerNurturing = { success: false, error: String(error) }
    }

    // Task 5: Generate recurring bookings (top up active series)
    try {
      const recurringResult = await generateRecurringBookings(4) // Keep 4 future bookings minimum
      results.recurringBookings = {
        success: true,
        seriesProcessed: recurringResult.seriesProcessed,
        bookingsCreated: recurringResult.bookingsCreated,
        errors: recurringResult.errors.length,
      }
      console.log(`[Cron] Recurring bookings: ${recurringResult.bookingsCreated} bookings created across ${recurringResult.seriesProcessed} series`)
      if (recurringResult.errors.length > 0) {
        console.warn('[Cron] Recurring booking errors:', recurringResult.errors)
      }
    } catch (error) {
      console.error('[Cron] Recurring bookings failed:', error)
      results.recurringBookings = { success: false, error: String(error) }
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
