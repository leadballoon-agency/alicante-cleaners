/**
 * Cleaner Availability API
 * GET: Get available/unavailable time slots for a cleaner on a specific date
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUnavailableSlots } from '@/lib/google-calendar'

// Standard working hours (can be customized per cleaner in the future)
const WORKING_HOURS = {
  start: 8, // 8:00 AM
  end: 20, // 8:00 PM
}

// Slot duration in hours
const SLOT_DURATION = 1

interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Parse the date
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Find the cleaner
    const cleaner = await db.cleaner.findUnique({
      where: { slug },
      select: {
        id: true,
        googleCalendarConnected: true,
        googleCalendarSyncedAt: true,
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Get all unavailable slots for this date
    const unavailableSlots = await getUnavailableSlots(cleaner.id, date)

    // Generate all possible time slots and mark availability
    const timeSlots: TimeSlot[] = []

    for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`
      const endTimeStr = `${(hour + SLOT_DURATION).toString().padStart(2, '0')}:00`

      // Check if this slot overlaps with any unavailable slot
      const conflict = unavailableSlots.find((slot) => {
        const slotStart = parseInt(slot.startTime.split(':')[0])
        const slotEnd = parseInt(slot.endTime.split(':')[0])
        // Check for overlap
        return hour < slotEnd && hour + SLOT_DURATION > slotStart
      })

      timeSlots.push({
        time: timeStr,
        available: !conflict,
        reason: conflict
          ? conflict.source === 'BOOKING'
            ? 'Already booked'
            : 'Unavailable'
          : undefined,
      })
    }

    return NextResponse.json({
      date: dateStr,
      cleanerId: cleaner.id,
      calendarConnected: cleaner.googleCalendarConnected,
      lastSynced: cleaner.googleCalendarSyncedAt,
      slots: timeSlots,
    })
  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}
