/**
 * Recurring Bookings Generator
 *
 * Ensures active recurring series always have enough future bookings.
 * Run by daily cron to top up series that are running low.
 */

import { db } from '@/lib/db'
import { RecurringStatus } from '@prisma/client'
import { addDaysMadrid, addMonthsMadrid } from '@/lib/dates'
import { onBookingCreated } from '@/lib/notifications/booking-notifications'
import { runSideEffects, type SideEffect } from '@/lib/side-effects'

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

  // Reminder-chain side effects for every materialized instance, collected
  // and awaited together at the end so the caller (the daily cron route)
  // doesn't return before they've completed.
  const sideEffects: SideEffect[] = []

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
        owner: { include: { user: { select: { name: true } } } },
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

          const created = await db.booking.create({
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

          // Each materialized instance is PENDING and needs a cleaner
          // response, so arm the same 1h/2h/6h reminder chain used
          // everywhere else a booking is created - this cron used to leave
          // auto-generated recurring instances with no reminder/escalation
          // coverage at all.
          sideEffects.push({
            label: `booking-reminder-chain:recurring-cron:${created.id}`,
            promise: onBookingCreated({
              id: created.id,
              cleanerId: created.cleanerId,
              ownerName: parent.owner.user.name || 'Villa Owner',
              propertyName: parent.property.name,
              service: created.service,
              date: created.date,
              time: created.time,
              price: Number(created.price),
            }),
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

  await runSideEffects(sideEffects)

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

// Helper function to calculate future dates. Shifts by whole Europe/Madrid
// calendar days/months while preserving the original Madrid wall-clock time
// (see lib/dates.ts) — NOT `date.setDate(date.getDate() + n)`, which shifts
// by 24h wall-clock in whatever timezone the process happens to run in
// (UTC on Vercel) and can drift the local Madrid time across DST changes.
function calculateFutureDates(
  startDate: Date,
  frequency: string,
  count: number
): Date[] {
  const dates: Date[] = []

  for (let i = 1; i <= count; i++) {
    switch (frequency) {
      case 'WEEKLY':
        dates.push(addDaysMadrid(startDate, i * 7))
        break
      case 'FORTNIGHTLY':
        dates.push(addDaysMadrid(startDate, i * 14))
        break
      case 'MONTHLY':
        dates.push(addMonthsMadrid(startDate, i))
        break
    }
  }

  return dates
}
