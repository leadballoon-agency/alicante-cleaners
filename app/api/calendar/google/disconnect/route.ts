/**
 * Google Calendar Disconnect API
 * POST: Disconnect cleaner's Google Calendar
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

    // Delete Google account link
    await db.account.deleteMany({
      where: {
        userId: session.user.id,
        provider: 'google',
      },
    })

    // Delete all Google Calendar availability entries
    await db.cleanerAvailability.deleteMany({
      where: {
        cleanerId: cleaner.id,
        source: 'GOOGLE_CALENDAR',
      },
    })

    // Update cleaner status
    await db.cleaner.update({
      where: { id: cleaner.id },
      data: {
        googleCalendarConnected: false,
        googleCalendarSyncedAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected',
    })
  } catch (error) {
    console.error('Calendar disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    )
  }
}
