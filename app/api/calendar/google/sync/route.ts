/**
 * Google Calendar Sync API
 * POST: Sync cleaner's Google Calendar to availability
 * GET: Get sync status
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { syncCleanerCalendar, getGoogleTokens } from '@/lib/google-calendar'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the cleaner profile
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 })
    }

    // Sync the calendar
    const result = await syncCleanerCalendar(cleaner.id)

    if (result.error) {
      return NextResponse.json(
        { error: result.error, synced: result.synced },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      synced: result.synced,
      message: `Synced ${result.synced} calendar events`,
    })
  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      select: {
        googleCalendarConnected: true,
        googleCalendarSyncedAt: true,
      },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 })
    }

    // Check if tokens are valid
    let tokensValid = false
    if (cleaner.googleCalendarConnected) {
      const tokens = await getGoogleTokens(session.user.id)
      tokensValid = !!tokens
    }

    // Get count of synced events
    const eventCount = await db.cleanerAvailability.count({
      where: {
        cleaner: { userId: session.user.id },
        source: 'GOOGLE_CALENDAR',
      },
    })

    return NextResponse.json({
      connected: cleaner.googleCalendarConnected && tokensValid,
      lastSynced: cleaner.googleCalendarSyncedAt,
      eventCount,
    })
  } catch (error) {
    console.error('Calendar status error:', error)
    return NextResponse.json(
      { error: 'Failed to get calendar status' },
      { status: 500 }
    )
  }
}
