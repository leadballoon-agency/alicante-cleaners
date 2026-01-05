/**
 * Cleaner Dashboard Availability API
 * GET: Get upcoming blocked times for the authenticated cleaner
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    // Get next 60 days of blocked times
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 60)

    const blocks = await db.cleanerAvailability.findMany({
      where: {
        cleanerId: cleaner.id,
        isAvailable: false,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        source: true,
        title: true,
      },
    })

    // Also get confirmed bookings as blocked times
    const bookings = await db.booking.findMany({
      where: {
        cleanerId: cleaner.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        time: true,
        hours: true,
        property: {
          select: { name: true },
        },
      },
    })

    // Convert bookings to block format
    const bookingBlocks = bookings.map((b) => {
      const [hours, minutes] = b.time.split(':').map(Number)
      const endHours = hours + b.hours
      return {
        id: `booking-${b.id}`,
        date: b.date.toISOString(),
        startTime: b.time,
        endTime: `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        source: 'BOOKING',
        title: b.property.name,
      }
    })

    // Combine and sort
    const allBlocks = [
      ...blocks.map((b) => ({
        ...b,
        date: b.date.toISOString(),
      })),
      ...bookingBlocks,
    ].sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.startTime)
      const dateB = new Date(b.date + 'T' + b.startTime)
      return dateA.getTime() - dateB.getTime()
    })

    return NextResponse.json({ blocks: allBlocks })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
