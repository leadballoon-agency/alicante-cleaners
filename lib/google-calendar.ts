/**
 * Google Calendar Integration
 * Fetches busy times from a cleaner's Google Calendar
 */

import { db } from './db'

interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

interface BusySlot {
  start: Date
  end: Date
}

interface CalendarEvent {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

interface FreeBusyResponse {
  calendars: {
    primary: {
      busy: Array<{ start: string; end: string }>
    }
  }
}

/**
 * Refresh Google access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      console.error('Failed to refresh token:', await response.text())
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

/**
 * Get valid Google tokens for a user, refreshing if needed
 */
export async function getGoogleTokens(userId: string): Promise<GoogleTokens | null> {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: 'google',
    },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  })

  if (!account?.access_token) {
    return null
  }

  // Check if token is expired (with 5 minute buffer)
  const isExpired = account.expires_at && account.expires_at * 1000 < Date.now() + 5 * 60 * 1000

  if (isExpired && account.refresh_token) {
    const newAccessToken = await refreshAccessToken(account.refresh_token)
    if (newAccessToken) {
      // Update the stored token
      await db.account.updateMany({
        where: { userId, provider: 'google' },
        data: {
          access_token: newAccessToken,
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        },
      })
      return {
        access_token: newAccessToken,
        refresh_token: account.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }
    }
    return null
  }

  return {
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expires_at: account.expires_at ?? undefined,
  }
}

/**
 * Fetch busy times from Google Calendar using FreeBusy API
 */
export async function fetchBusyTimes(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<BusySlot[]> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          items: [{ id: 'primary' }],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Google Calendar FreeBusy error:', error)
      throw new Error(`Failed to fetch busy times: ${response.status}`)
    }

    const data: FreeBusyResponse = await response.json()
    const busySlots = data.calendars?.primary?.busy || []

    return busySlots.map((slot) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
    }))
  } catch (error) {
    console.error('Error fetching busy times:', error)
    throw error
  }
}

/**
 * Fetch calendar events (more detailed than FreeBusy)
 */
export async function fetchCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  try {
    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    })

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Google Calendar events error:', error)
      throw new Error(`Failed to fetch events: ${response.status}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    throw error
  }
}

/**
 * Sync a cleaner's Google Calendar to their availability
 */
export async function syncCleanerCalendar(cleanerId: string): Promise<{
  synced: number
  error?: string
}> {
  try {
    // Get the cleaner and their user
    const cleaner = await db.cleaner.findUnique({
      where: { id: cleanerId },
      select: { userId: true, googleCalendarConnected: true },
    })

    if (!cleaner) {
      return { synced: 0, error: 'Cleaner not found' }
    }

    if (!cleaner.googleCalendarConnected) {
      return { synced: 0, error: 'Google Calendar not connected' }
    }

    // Get valid tokens
    const tokens = await getGoogleTokens(cleaner.userId)
    if (!tokens) {
      // Mark calendar as disconnected
      await db.cleaner.update({
        where: { id: cleanerId },
        data: { googleCalendarConnected: false },
      })
      return { synced: 0, error: 'Google tokens expired or invalid' }
    }

    // Fetch next 60 days of busy times
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 60)

    const busySlots = await fetchBusyTimes(tokens.access_token, startDate, endDate)

    // Delete existing Google Calendar entries for this cleaner
    await db.cleanerAvailability.deleteMany({
      where: {
        cleanerId,
        source: 'GOOGLE_CALENDAR',
      },
    })

    // Create new availability blocks (isAvailable: false for busy times)
    const availabilityRecords = busySlots.map((slot) => ({
      cleanerId,
      date: new Date(slot.start.toISOString().split('T')[0]),
      startTime: slot.start.toTimeString().slice(0, 5),
      endTime: slot.end.toTimeString().slice(0, 5),
      isAvailable: false,
      source: 'GOOGLE_CALENDAR' as const,
    }))

    // Insert new records (skip duplicates)
    let synced = 0
    for (const record of availabilityRecords) {
      try {
        await db.cleanerAvailability.create({
          data: record,
        })
        synced++
      } catch {
        // Skip duplicates (unique constraint violation)
      }
    }

    // Update sync timestamp
    await db.cleaner.update({
      where: { id: cleanerId },
      data: { googleCalendarSyncedAt: new Date() },
    })

    return { synced }
  } catch (error) {
    console.error('Error syncing calendar:', error)
    return { synced: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check if a cleaner is available at a specific time
 */
export async function isCleanerAvailable(
  cleanerId: string,
  date: Date,
  startTime: string,
  endTime: string
): Promise<boolean> {
  // Check for any overlapping unavailable blocks
  const unavailableBlock = await db.cleanerAvailability.findFirst({
    where: {
      cleanerId,
      date: {
        equals: new Date(date.toISOString().split('T')[0]),
      },
      isAvailable: false,
      // Check for time overlap
      OR: [
        // Block starts during requested time
        {
          startTime: { gte: startTime, lt: endTime },
        },
        // Block ends during requested time
        {
          endTime: { gt: startTime, lte: endTime },
        },
        // Block encompasses requested time
        {
          startTime: { lte: startTime },
          endTime: { gte: endTime },
        },
      ],
    },
  })

  // Also check for confirmed bookings at this time
  const existingBooking = await db.booking.findFirst({
    where: {
      cleanerId,
      date: {
        gte: new Date(date.toISOString().split('T')[0]),
        lt: new Date(new Date(date).setDate(date.getDate() + 1)),
      },
      time: startTime,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  })

  return !unavailableBlock && !existingBooking
}

/**
 * Sync all team members' Google Calendars and update the team availability cache
 */
export async function syncAllTeamCalendars(): Promise<{
  teamsProcessed: number
  membersProcessed: number
  membersSynced: number
  errors: Array<{ teamId: string; memberId: string; error: string }>
}> {
  const errors: Array<{ teamId: string; memberId: string; error: string }> = []
  let teamsProcessed = 0
  let membersProcessed = 0
  let membersSynced = 0

  try {
    // Get all teams that require calendar sync
    const teams = await db.team.findMany({
      where: {
        requireCalendarSync: true,
      },
      select: {
        id: true,
        members: {
          where: {
            status: 'ACTIVE',
            googleCalendarConnected: true,
          },
          select: {
            id: true,
            userId: true,
            calendarSyncStatus: true,
          },
        },
      },
    })

    for (const team of teams) {
      teamsProcessed++

      for (const member of team.members) {
        membersProcessed++

        try {
          // Update status to syncing
          await db.cleaner.update({
            where: { id: member.id },
            data: { calendarSyncStatus: 'SYNCING' },
          })

          // Sync the member's calendar
          const result = await syncCleanerCalendar(member.id)

          if (result.error) {
            errors.push({ teamId: team.id, memberId: member.id, error: result.error })
            await db.cleaner.update({
              where: { id: member.id },
              data: { calendarSyncStatus: 'ERROR' },
            })
          } else {
            membersSynced++
            await db.cleaner.update({
              where: { id: member.id },
              data: { calendarSyncStatus: 'SYNCED' },
            })
          }

          // Update team availability cache
          await updateTeamAvailabilityCache(team.id, member.id)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ teamId: team.id, memberId: member.id, error: errorMessage })
          await db.cleaner.update({
            where: { id: member.id },
            data: { calendarSyncStatus: 'ERROR' },
          })
        }
      }
    }

    return { teamsProcessed, membersProcessed, membersSynced, errors }
  } catch (error) {
    console.error('Error syncing team calendars:', error)
    throw error
  }
}

/**
 * Update the TeamAvailabilityCache for a specific team member
 */
async function updateTeamAvailabilityCache(teamId: string, memberId: string): Promise<void> {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 14) // Cache 14 days

  // Get cleaner's bookings
  const bookings = await db.booking.findMany({
    where: {
      cleanerId: memberId,
      date: { gte: startDate, lte: endDate },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      property: { select: { name: true, address: true } },
      owner: { include: { user: { select: { name: true } } } },
    },
    orderBy: { date: 'asc' },
  })

  // Get Google Calendar busy slots
  const googleBusy = await db.cleanerAvailability.findMany({
    where: {
      cleanerId: memberId,
      date: { gte: startDate, lte: endDate },
      source: 'GOOGLE_CALENDAR',
      isAvailable: false,
    },
    orderBy: { date: 'asc' },
  })

  // Group by date
  const dateAvailability: Record<string, Array<{
    startTime: string
    endTime: string
    isAvailable: boolean
    source: string
    bookingId?: string
    title?: string
  }>> = {}

  // Add booking slots
  for (const booking of bookings) {
    const dateStr = booking.date.toISOString().split('T')[0]
    if (!dateAvailability[dateStr]) dateAvailability[dateStr] = []

    const [hours, minutes] = booking.time.split(':').map(Number)
    const endHours = hours + booking.hours
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    const locationName = booking.property?.name || booking.property?.address || 'Property'

    dateAvailability[dateStr].push({
      startTime: booking.time,
      endTime,
      isAvailable: false,
      source: 'BOOKING',
      bookingId: booking.id,
      title: `${booking.service} - ${locationName}`,
    })
  }

  // Add Google Calendar busy slots
  for (const slot of googleBusy) {
    const dateStr = slot.date.toISOString().split('T')[0]
    if (!dateAvailability[dateStr]) dateAvailability[dateStr] = []

    dateAvailability[dateStr].push({
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: false,
      source: 'GOOGLE_CALENDAR',
    })
  }

  // Upsert cache entries for each date
  for (const [dateStr, slots] of Object.entries(dateAvailability)) {
    await db.teamAvailabilityCache.upsert({
      where: {
        teamId_date_memberId: {
          teamId,
          date: new Date(dateStr),
          memberId,
        },
      },
      create: {
        teamId,
        date: new Date(dateStr),
        memberId,
        availability: slots,
      },
      update: {
        availability: slots,
        lastUpdated: new Date(),
      },
    })
  }
}

/**
 * Get all unavailable slots for a cleaner on a specific date
 */
export async function getUnavailableSlots(
  cleanerId: string,
  date: Date
): Promise<Array<{ startTime: string; endTime: string; source: string }>> {
  const dateOnly = new Date(date.toISOString().split('T')[0])

  const unavailable = await db.cleanerAvailability.findMany({
    where: {
      cleanerId,
      date: dateOnly,
      isAvailable: false,
    },
    select: {
      startTime: true,
      endTime: true,
      source: true,
    },
  })

  // Also get confirmed/pending bookings
  const bookings = await db.booking.findMany({
    where: {
      cleanerId,
      date: {
        gte: dateOnly,
        lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000),
      },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: {
      time: true,
      hours: true,
    },
  })

  // Convert bookings to unavailable slots
  const bookingSlots = bookings.map((b) => {
    const [hours, minutes] = b.time.split(':').map(Number)
    const endHours = hours + b.hours
    return {
      startTime: b.time,
      endTime: `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      source: 'BOOKING',
    }
  })

  return [...unavailable, ...bookingSlots]
}
