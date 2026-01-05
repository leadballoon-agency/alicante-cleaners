/**
 * Booking Notification System
 *
 * Handles notifications, reminders, and escalation for booking requests:
 * - Creates notification when new booking is created
 * - Sends reminder after 1 hour if no response
 * - Escalates to team after 2 hours
 * - Auto-declines after 6 hours with AI suggesting alternatives
 */

import { db } from '@/lib/db'

interface BookingDetails {
  id: string
  cleanerId: string
  ownerName: string
  propertyName: string
  service: string
  date: Date
  time: string
  price: number
}

/**
 * Create initial notification and tracker when a new booking is created
 */
export async function onBookingCreated(booking: BookingDetails) {
  // Get cleaner user ID
  const cleaner = await db.cleaner.findUnique({
    where: { id: booking.cleanerId },
    include: { user: true },
  })

  if (!cleaner) return

  // Format date for notification
  const dateStr = booking.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Create notification for cleaner
  await db.notification.create({
    data: {
      userId: cleaner.userId,
      type: 'BOOKING_REQUEST',
      title: 'New Booking Request',
      message: `${booking.ownerName} wants to book a ${booking.service} for ${dateStr} at ${booking.time}. €${booking.price}`,
      data: {
        bookingId: booking.id,
        ownerName: booking.ownerName,
        propertyName: booking.propertyName,
        service: booking.service,
        date: booking.date.toISOString(),
        time: booking.time,
        price: booking.price,
      },
      actionUrl: `/dashboard?tab=bookings&booking=${booking.id}`,
    },
  })

  // Create response tracker
  await db.bookingResponseTracker.create({
    data: {
      bookingId: booking.id,
      cleanerId: booking.cleanerId,
    },
  })

  console.log(`[Notification] New booking request created for cleaner ${cleaner.user.name}`)
}

/**
 * Process pending bookings and send reminders/escalations
 * This should be called periodically (e.g., every 10 minutes via cron)
 */
export async function processBookingReminders() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)

  // Get all unresponded booking trackers
  const trackers = await db.bookingResponseTracker.findMany({
    where: {
      respondedAt: null,
      autoDeclinedAt: null,
    },
    include: {
      booking: {
        include: {
          owner: { include: { user: true } },
          property: true,
          cleaner: {
            include: {
              user: true,
              memberOfTeam: {
                include: {
                  leader: { include: { user: true } },
                  members: { include: { user: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  for (const tracker of trackers) {
    const booking = tracker.booking
    const cleaner = booking.cleaner
    const createdAt = tracker.createdAt

    // Skip if booking is no longer PENDING
    if (booking.status !== 'PENDING') {
      await db.bookingResponseTracker.update({
        where: { id: tracker.id },
        data: { respondedAt: now },
      })
      continue
    }

    // Auto-decline after 6 hours
    if (createdAt < sixHoursAgo && !tracker.autoDeclinedAt) {
      await autoDeclineBooking(tracker.id, booking)
      continue
    }

    // Escalate to team after 2 hours
    if (createdAt < twoHoursAgo && !tracker.escalatedAt) {
      await escalateToTeam(tracker.id, booking, cleaner)
      continue
    }

    // Send first reminder after 1 hour
    if (createdAt < oneHourAgo && !tracker.reminder1SentAt) {
      await sendReminder(tracker.id, booking, cleaner, 1)
      continue
    }
  }

  return { processed: trackers.length }
}

/**
 * Send reminder notification to cleaner
 */
async function sendReminder(
  trackerId: string,
  booking: {
    id: string
    owner: { user: { name: string | null } }
    service: string
    date: Date
    time: string
  },
  cleaner: { userId: string; user: { name: string | null } },
  reminderNumber: 1 | 2
) {
  const dateStr = booking.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  await db.notification.create({
    data: {
      userId: cleaner.userId,
      type: 'BOOKING_REMINDER',
      title: reminderNumber === 1 ? 'Booking Needs Response' : 'Urgent: Booking Response Required',
      message: reminderNumber === 1
        ? `Reminder: ${booking.owner.user.name}'s ${booking.service} on ${dateStr} is waiting for your confirmation.`
        : `Urgent: Please respond to ${booking.owner.user.name}'s booking request. It will be escalated to your team if not confirmed soon.`,
      data: { bookingId: booking.id },
      actionUrl: `/dashboard?tab=bookings&booking=${booking.id}`,
    },
  })

  await db.bookingResponseTracker.update({
    where: { id: trackerId },
    data: reminderNumber === 1 ? { reminder1SentAt: new Date() } : { reminder2SentAt: new Date() },
  })

  console.log(`[Notification] Reminder ${reminderNumber} sent for booking ${booking.id}`)
}

/**
 * Escalate booking to team members
 */
async function escalateToTeam(
  trackerId: string,
  booking: {
    id: string
    owner: { user: { name: string | null } }
    property: { name: string }
    service: string
    date: Date
    time: string
    price: number | { toNumber(): number }
  },
  cleaner: {
    userId: string
    user: { name: string | null }
    memberOfTeam: {
      leader: { userId: string; user: { name: string | null } }
      members: Array<{ userId: string; user: { name: string | null } }>
    } | null
  }
) {
  const dateStr = booking.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Notify the original cleaner about escalation
  await db.notification.create({
    data: {
      userId: cleaner.userId,
      type: 'BOOKING_ESCALATED',
      title: 'Booking Escalated to Team',
      message: `${booking.owner.user.name}'s booking has been shared with your team due to no response. Please confirm soon or a team member may cover it.`,
      data: { bookingId: booking.id },
      actionUrl: `/dashboard?tab=bookings&booking=${booking.id}`,
    },
  })

  // If cleaner is part of a team, notify team leader and members
  if (cleaner.memberOfTeam) {
    const team = cleaner.memberOfTeam
    const teamMembers = [team.leader, ...team.members].filter(
      m => m.userId !== cleaner.userId
    )

    for (const member of teamMembers) {
      await db.notification.create({
        data: {
          userId: member.userId,
          type: 'BOOKING_ESCALATED',
          title: 'Team Coverage Needed',
          message: `${cleaner.user.name} hasn't responded to a booking. Can you cover ${booking.service} at ${booking.property.name} on ${dateStr} at ${booking.time}? €${typeof booking.price === 'number' ? booking.price : booking.price.toNumber()}`,
          data: {
            bookingId: booking.id,
            originalCleanerId: cleaner.userId,
            canCover: true,
          },
          actionUrl: `/dashboard?tab=bookings&cover=${booking.id}`,
        },
      })
    }

    console.log(`[Notification] Booking ${booking.id} escalated to ${teamMembers.length} team members`)
  }

  await db.bookingResponseTracker.update({
    where: { id: trackerId },
    data: { escalatedAt: new Date() },
  })
}

/**
 * Auto-decline booking after 6 hours with AI message
 */
async function autoDeclineBooking(
  trackerId: string,
  booking: {
    id: string
    cleanerId: string
    owner: { user: { name: string | null } }
    property: { name: string }
    service: string
    date: Date
    cleaner: { user: { name: string | null } }
  }
) {
  // Update booking status to CANCELLED
  await db.booking.update({
    where: { id: booking.id },
    data: { status: 'CANCELLED' },
  })

  // Notify owner with apology and alternatives
  // Note: In production, this would trigger an AI message with alternative cleaner suggestions
  const ownerUser = await db.owner.findFirst({
    where: { id: booking.id },
    include: { user: true },
  })

  if (ownerUser) {
    await db.notification.create({
      data: {
        userId: ownerUser.userId,
        type: 'BOOKING_AUTO_DECLINED',
        title: 'Booking Not Confirmed',
        message: `Unfortunately, ${booking.cleaner.user.name} wasn't able to confirm your booking in time. We're finding alternative cleaners for you.`,
        data: {
          bookingId: booking.id,
          originalCleanerId: booking.cleanerId,
          suggestAlternatives: true,
        },
        actionUrl: `/owner/dashboard?find-alternative=${booking.id}`,
      },
    })
  }

  // Notify cleaner about missed booking
  await db.notification.create({
    data: {
      userId: booking.cleaner.user.name ? booking.cleanerId : '',
      type: 'BOOKING_AUTO_DECLINED',
      title: 'Booking Auto-Declined',
      message: `The booking from ${booking.owner.user.name} was automatically declined due to no response. Please respond to bookings within 6 hours.`,
      data: { bookingId: booking.id },
    },
  })

  await db.bookingResponseTracker.update({
    where: { id: trackerId },
    data: { autoDeclinedAt: new Date() },
  })

  console.log(`[Notification] Booking ${booking.id} auto-declined after 6 hours`)
}

/**
 * Mark a booking as responded (cleaner confirmed or declined)
 */
export async function markBookingResponded(bookingId: string) {
  await db.bookingResponseTracker.updateMany({
    where: { bookingId },
    data: { respondedAt: new Date() },
  })
}

/**
 * Create notification when booking is confirmed
 */
export async function onBookingConfirmed(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      owner: { include: { user: true } },
      cleaner: { include: { user: true } },
      property: true,
    },
  })

  if (!booking) return

  const dateStr = booking.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // Notify owner
  await db.notification.create({
    data: {
      userId: booking.owner.userId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed!',
      message: `${booking.cleaner.user.name} has confirmed your ${booking.service} at ${booking.property.name} on ${dateStr} at ${booking.time}.`,
      data: { bookingId },
      actionUrl: `/owner/dashboard?booking=${bookingId}`,
    },
  })

  // Mark as responded
  await markBookingResponded(bookingId)

  console.log(`[Notification] Booking ${bookingId} confirmed`)
}
