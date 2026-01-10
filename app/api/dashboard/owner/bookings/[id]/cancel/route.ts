import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
          select: { userId: true },
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

    // TODO: Send notification to cleaner about cancellation

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
