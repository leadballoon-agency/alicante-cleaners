/**
 * Team Calendar API
 *
 * GET /api/dashboard/cleaner/team/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Returns aggregated team availability for the team leader's calendar view.
 * Includes all team members' availability from:
 * - Google Calendar sync (busy times)
 * - Platform bookings
 * - Manual blocks
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface AvailabilitySlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  source: 'GOOGLE_CALENDAR' | 'BOOKING' | 'MANUAL'
  bookingId?: string
  title?: string
}

interface MemberAvailability {
  memberId: string
  memberName: string
  memberPhoto: string | null
  calendarSyncStatus: string
  lastSynced: Date | null
  availability: Record<string, AvailabilitySlot[]> // date string -> slots
}

interface TeamCalendarResponse {
  team: {
    id: string
    name: string
    requireCalendarSync: boolean
  }
  members: MemberAvailability[]
  dateRange: {
    startDate: string
    endDate: string
  }
  errors?: Array<{
    memberId: string
    error: string
    lastSynced: Date | null
  }>
  partialData: boolean
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get cleaner and verify they are a team leader
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        ledTeam: {
          include: {
            members: {
              include: {
                user: { select: { name: true, image: true } },
              },
            },
          },
        },
        user: { select: { name: true, image: true } },
      },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    if (!cleaner.ledTeam) {
      return NextResponse.json(
        { error: 'You must be a team leader to view the team calendar' },
        { status: 403 }
      )
    }

    // Parse date range from query params
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Default to current week if no dates provided
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
    endOfWeek.setHours(23, 59, 59, 999)

    const startDate = startDateParam ? new Date(startDateParam) : startOfWeek
    const endDate = endDateParam ? new Date(endDateParam) : endOfWeek

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Limit range to 31 days max
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 31) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 31 days' },
        { status: 400 }
      )
    }

    // All team members = team leader + team members
    const allMembers = [
      {
        id: cleaner.id,
        user: cleaner.user,
        calendarSyncStatus: cleaner.calendarSyncStatus,
        googleCalendarSyncedAt: cleaner.googleCalendarSyncedAt,
      },
      ...cleaner.ledTeam.members.map((m) => ({
        id: m.id,
        user: m.user,
        calendarSyncStatus: m.calendarSyncStatus,
        googleCalendarSyncedAt: m.googleCalendarSyncedAt,
      })),
    ]

    const errors: TeamCalendarResponse['errors'] = []
    const membersAvailability: MemberAvailability[] = []

    // Fetch availability for each member
    for (const member of allMembers) {
      try {
        const memberAvailability = await fetchMemberAvailability(
          member.id,
          startDate,
          endDate
        )

        membersAvailability.push({
          memberId: member.id,
          memberName: member.user.name || 'Unknown',
          memberPhoto: member.user.image,
          calendarSyncStatus: member.calendarSyncStatus || 'NOT_CONNECTED',
          lastSynced: member.googleCalendarSyncedAt,
          availability: memberAvailability,
        })
      } catch (error) {
        console.error(`Error fetching availability for ${member.id}:`, error)
        errors.push({
          memberId: member.id,
          error: 'sync_failed',
          lastSynced: member.googleCalendarSyncedAt,
        })
        // Still add member with empty availability
        membersAvailability.push({
          memberId: member.id,
          memberName: member.user.name || 'Unknown',
          memberPhoto: member.user.image,
          calendarSyncStatus: member.calendarSyncStatus || 'ERROR',
          lastSynced: member.googleCalendarSyncedAt,
          availability: {},
        })
      }
    }

    const response: TeamCalendarResponse = {
      team: {
        id: cleaner.ledTeam.id,
        name: cleaner.ledTeam.name,
        requireCalendarSync: cleaner.ledTeam.requireCalendarSync,
      },
      members: membersAvailability,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      errors: errors.length > 0 ? errors : undefined,
      partialData: errors.length > 0,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching team calendar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team calendar' },
      { status: 500 }
    )
  }
}

/**
 * Fetch availability for a single member across a date range
 */
async function fetchMemberAvailability(
  cleanerId: string,
  startDate: Date,
  endDate: Date
): Promise<Record<string, AvailabilitySlot[]>> {
  const availability: Record<string, AvailabilitySlot[]> = {}

  // Generate all dates in range
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    availability[dateStr] = []
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Fetch CleanerAvailability records (Google Calendar + Manual blocks)
  const availabilityRecords = await db.cleanerAvailability.findMany({
    where: {
      cleanerId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { startTime: 'asc' },
  })

  // Add availability records to the appropriate date
  for (const record of availabilityRecords) {
    const dateStr = record.date.toISOString().split('T')[0]
    if (availability[dateStr]) {
      availability[dateStr].push({
        startTime: record.startTime,
        endTime: record.endTime,
        isAvailable: record.isAvailable,
        source: record.source as 'GOOGLE_CALENDAR' | 'MANUAL',
        title: record.title || undefined,
      })
    }
  }

  // Fetch bookings for this member
  const bookings = await db.booking.findMany({
    where: {
      cleanerId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
    },
    include: {
      property: { select: { name: true, address: true } },
    },
    orderBy: { time: 'asc' },
  })

  // Add bookings as busy slots
  for (const booking of bookings) {
    const dateStr = booking.date.toISOString().split('T')[0]
    if (availability[dateStr]) {
      // Calculate end time from start time + hours
      const [hours, minutes] = booking.time.split(':').map(Number)
      const endHours = hours + booking.hours
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

      availability[dateStr].push({
        startTime: booking.time,
        endTime,
        isAvailable: false,
        source: 'BOOKING',
        bookingId: booking.id,
        title: `${booking.service} - ${booking.property.name || booking.property.address}`,
      })
    }
  }

  // Sort each day's slots by start time
  for (const dateStr of Object.keys(availability)) {
    availability[dateStr].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  return availability
}
