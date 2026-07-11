import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendPushToStaff, sendPushToUser, cleanerPushText } from '@/lib/push'
import { runSideEffects } from '@/lib/side-effects'
import { formatMadridDate } from '@/lib/dates'

// POST /api/dashboard/owner/bookings/[id]/cancel - Cancel a booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: bookingId } = await params

    const owner = await db.owner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      )
    }

    // Get the booking and verify it belongs to this owner
    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        ownerId: owner.id,
      },
      include: {
        cleaner: {
          select: { userId: true, user: { select: { name: true, preferredLanguage: true } } },
        },
        owner: {
          select: { user: { select: { name: true } } },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Can only cancel PENDING or CONFIRMED bookings
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `Cannot cancel a ${booking.status.toLowerCase()} booking` },
        { status: 400 }
      )
    }

    // Update booking status to cancelled
    await db.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    })

    // Notify staff and the cleaner (web push) — awaited so both complete
    // before the serverless function's response freezes execution.
    const dateStr = formatMadridDate(booking.date, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    const isEnglish = booking.cleaner.user.preferredLanguage === 'en'
    const cancelSummary = isEnglish
      ? `${booking.owner.user.name || 'An owner'} cancelled their ${booking.service} on ${dateStr}`
      : `${booking.owner.user.name || 'Un propietario'} canceló su ${booking.service} el ${dateStr}`
    await runSideEffects([
      {
        label: `push:staff-booking-cancelled:${booking.id}`,
        promise: sendPushToStaff({
          title: '🚫 Booking cancelled',
          body: `${booking.owner.user.name || 'An owner'} cancelled their ${booking.service} with ${booking.cleaner.user.name || 'their cleaner'}`,
          url: '/admin?tab=bookings',
          tag: `booking-cancelled-${booking.id}`,
        }),
      },
      {
        label: `push:cleaner-booking-cancelled:${booking.id}`,
        promise: sendPushToUser(
          booking.cleaner.userId,
          cleanerPushText('bookingCancelled', booking.cleaner.user.preferredLanguage, cancelSummary)
        ),
      },
    ])

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
