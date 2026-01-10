/**
 * Recurring Bookings Generator
 *
 * Ensures active recurring series always have enough future bookings.
 * Run by daily cron to top up series that are running low.
 */

import { db } from '@/lib/db'
import { RecurringStatus } from '@prisma/client'

interface GenerationResult {
  seriesProcessed: number
  bookingsCreated: number
  errors: string[]
}

/**
 * Generate future bookings for active recurring series
 *
 * For each active series, ensures there are at least `minFutureBookings`
 * pending bookings in the future. Creates new ones if needed.
 */
export async function generateRecurringBookings(
  minFutureBookings: number = 4
): Promise<GenerationResult> {
  const result: GenerationResult = {
    seriesProcessed: 0,
    bookingsCreated: 0,
    errors: [],
  }

  try {
    // Find all unique active recurring series (by groupId)
    const activeSeriesParents = await db.booking.findMany({
      where: {
        isRecurring: true,
        recurringStatus: RecurringStatus.ACTIVE,
        recurringParentId: null, // Only parent bookings
        recurringGroupId: { not: null },
      },
      include: {
        property: true,
        cleaner: true,
        owner: true,
      },
    })

    const now = new Date()

    for (const parent of activeSeriesParents) {
      try {
        if (!parent.recurringGroupId || !parent.recurringFrequency) continue

        // Count future pending bookings in this series
        const futurePendingCount = await db.booking.count({
          where: {
            recurringGroupId: parent.recurringGroupId,
            status: 'PENDING',
            date: { gte: now },
            recurringSkipped: false,
          },
        })

        // If we have enough, skip
        if (futurePendingCount >= minFutureBookings) {
          result.seriesProcessed++
          continue
        }

        // Find the latest booking in the series to calculate next dates
        const latestBooking = await db.booking.findFirst({
          where: {
            recurringGroupId: parent.recurringGroupId,
          },
          orderBy: { date: 'desc' },
        })

        if (!latestBooking) continue

        // Calculate how many more bookings we need
        const needed = minFutureBookings - futurePendingCount

        // Generate dates
        const futureDates = calculateFutureDates(
          latestBooking.date,
          parent.recurringFrequency,
          needed
        )

        // Create the bookings
        for (const date of futureDates) {
          const shortCode = Math.floor(1000 + Math.random() * 9000).toString()

          await db.booking.create({
            data: {
              cleanerId: parent.cleanerId,
              ownerId: parent.ownerId,
              propertyId: parent.propertyId,
              status: 'PENDING',
              service: parent.service,
              price: parent.price,
              hours: parent.hours,
              date,
              time: parent.time,
              notes: parent.notes,
              shortCode,
              isRecurring: true,
              recurringFrequency: parent.recurringFrequency,
              recurringGroupId: parent.recurringGroupId,
              recurringParentId: parent.id,
            },
          })

          result.bookingsCreated++
        }

        result.seriesProcessed++
      } catch (seriesError) {
        result.errors.push(
          `Series ${parent.recurringGroupId}: ${String(seriesError)}`
        )
      }
    }
  } catch (error) {
    result.errors.push(`Global error: ${String(error)}`)
  }

  return result
}

/**
 * Get recurring series info for a booking
 */
export async function getRecurringSeriesInfo(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking?.recurringGroupId) {
    return null
  }

  const allInSeries = await db.booking.findMany({
    where: {
      recurringGroupId: booking.recurringGroupId,
    },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      status: true,
      recurringSkipped: true,
    },
  })

  const parent = await db.booking.findFirst({
    where: {
      recurringGroupId: booking.recurringGroupId,
      recurringParentId: null,
    },
  })

  return {
    groupId: booking.recurringGroupId,
    frequency: booking.recurringFrequency,
    status: parent?.recurringStatus || 'ACTIVE',
    totalBookings: allInSeries.length,
    upcomingBookings: allInSeries.filter(
      (b) => b.date >= new Date() && b.status === 'PENDING' && !b.recurringSkipped
    ),
    completedBookings: allInSeries.filter((b) => b.status === 'COMPLETED'),
    skippedBookings: allInSeries.filter((b) => b.recurringSkipped),
    allBookings: allInSeries,
  }
}

// Helper function to calculate future dates
function calculateFutureDates(
  startDate: Date,
  frequency: string,
  count: number
): Date[] {
  const dates: Date[] = []
  const baseDate = new Date(startDate)

  for (let i = 1; i <= count; i++) {
    const nextDate = new Date(baseDate)

    switch (frequency) {
      case 'WEEKLY':
        nextDate.setDate(baseDate.getDate() + i * 7)
        break
      case 'FORTNIGHTLY':
        nextDate.setDate(baseDate.getDate() + i * 14)
        break
      case 'MONTHLY':
        nextDate.setMonth(baseDate.getMonth() + i)
        break
    }

    dates.push(nextDate)
  }

  return dates
}
