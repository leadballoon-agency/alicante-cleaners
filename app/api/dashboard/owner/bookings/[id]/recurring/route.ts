import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { RecurringFrequency, RecurringStatus } from '@prisma/client'

// POST - Make a booking recurring (creates future instances)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { frequency, count = 4 } = body as {
      frequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'
      count?: number // How many future instances to create (default 4)
    }

    if (!frequency || !['WEEKLY', 'FORTNIGHTLY', 'MONTHLY'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Must be WEEKLY, FORTNIGHTLY, or MONTHLY' },
        { status: 400 }
      )
    }

    // Get the owner
    const owner = await db.owner.findFirst({
      where: { user: { email: session.user.email } },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Get the booking
    const booking = await db.booking.findFirst({
      where: {
        id,
        ownerId: owner.id,
      },
      include: {
        property: true,
        cleaner: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Can only make CONFIRMED or COMPLETED bookings recurring
    if (!['CONFIRMED', 'COMPLETED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Only confirmed or completed bookings can be made recurring' },
        { status: 400 }
      )
    }

    // Check if already recurring
    if (booking.isRecurring) {
      return NextResponse.json(
        { error: 'Booking is already recurring' },
        { status: 400 }
      )
    }

    // Generate a group ID for the recurring series
    const recurringGroupId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Update the original booking to be the parent
    await db.booking.update({
      where: { id },
      data: {
        isRecurring: true,
        recurringFrequency: frequency as RecurringFrequency,
        recurringGroupId,
        recurringStatus: RecurringStatus.ACTIVE,
      },
    })

    // Calculate dates for future bookings
    const futureDates = calculateFutureDates(booking.date, frequency, count)

    // Create future booking instances
    const createdBookings = await Promise.all(
      futureDates.map(async (date) => {
        // Generate a short code for WhatsApp commands
        const shortCode = Math.floor(1000 + Math.random() * 9000).toString()

        return db.booking.create({
          data: {
            cleanerId: booking.cleanerId,
            ownerId: booking.ownerId,
            propertyId: booking.propertyId,
            status: 'PENDING', // Future bookings start as pending
            service: booking.service,
            price: booking.price,
            hours: booking.hours,
            date,
            time: booking.time,
            notes: booking.notes,
            shortCode,
            isRecurring: true,
            recurringFrequency: frequency as RecurringFrequency,
            recurringGroupId,
            recurringParentId: id,
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      message: `Created ${createdBookings.length} recurring bookings`,
      recurringGroupId,
      bookings: createdBookings.map((b) => ({
        id: b.id,
        date: b.date,
        status: b.status,
      })),
    })
  } catch (error) {
    console.error('Error making booking recurring:', error)
    return NextResponse.json(
      { error: 'Failed to make booking recurring' },
      { status: 500 }
    )
  }
}

// PATCH - Update recurring series (pause, resume, cancel)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { action } = body as { action: 'pause' | 'resume' | 'cancel' }

    if (!action || !['pause', 'resume', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be pause, resume, or cancel' },
        { status: 400 }
      )
    }

    // Get the owner
    const owner = await db.owner.findFirst({
      where: { user: { email: session.user.email } },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Get the booking (could be parent or child)
    const booking = await db.booking.findFirst({
      where: {
        id,
        ownerId: owner.id,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!booking.isRecurring || !booking.recurringGroupId) {
      return NextResponse.json(
        { error: 'Booking is not part of a recurring series' },
        { status: 400 }
      )
    }

    // Determine the new status
    const newStatus: RecurringStatus =
      action === 'pause'
        ? RecurringStatus.PAUSED
        : action === 'resume'
          ? RecurringStatus.ACTIVE
          : RecurringStatus.CANCELLED

    // Update all bookings in the series
    const updateResult = await db.booking.updateMany({
      where: {
        recurringGroupId: booking.recurringGroupId,
      },
      data: {
        recurringStatus: newStatus,
      },
    })

    // If cancelling, also cancel all pending future bookings
    if (action === 'cancel') {
      await db.booking.updateMany({
        where: {
          recurringGroupId: booking.recurringGroupId,
          status: 'PENDING',
          date: { gte: new Date() },
        },
        data: {
          status: 'CANCELLED',
        },
      })
    }

    return NextResponse.json({
      success: true,
      action,
      updatedCount: updateResult.count,
      message:
        action === 'pause'
          ? 'Recurring series paused'
          : action === 'resume'
            ? 'Recurring series resumed'
            : 'Recurring series cancelled',
    })
  } catch (error) {
    console.error('Error updating recurring series:', error)
    return NextResponse.json(
      { error: 'Failed to update recurring series' },
      { status: 500 }
    )
  }
}

// DELETE - Remove recurring from a booking (keep as one-time)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the owner
    const owner = await db.owner.findFirst({
      where: { user: { email: session.user.email } },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Get the booking
    const booking = await db.booking.findFirst({
      where: {
        id,
        ownerId: owner.id,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!booking.isRecurring) {
      return NextResponse.json(
        { error: 'Booking is not recurring' },
        { status: 400 }
      )
    }

    // Remove recurring flag from this booking only
    await db.booking.update({
      where: { id },
      data: {
        isRecurring: false,
        recurringFrequency: null,
        recurringGroupId: null,
        recurringStatus: null,
        recurringParentId: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Booking is now a one-time booking',
    })
  } catch (error) {
    console.error('Error removing recurring:', error)
    return NextResponse.json(
      { error: 'Failed to remove recurring' },
      { status: 500 }
    )
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
