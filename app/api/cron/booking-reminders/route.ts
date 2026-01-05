/**
 * Cron Job: Process Booking Reminders
 *
 * GET /api/cron/booking-reminders
 *
 * Should be called every 10 minutes by Vercel Cron or external service.
 * Processes pending bookings and sends reminders/escalations.
 */

import { NextResponse } from 'next/server'
import { processBookingReminders } from '@/lib/notifications/booking-notifications'

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process reminders
    const result = await processBookingReminders()

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}
