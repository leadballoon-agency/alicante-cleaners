import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { RecurringFrequency, RecurringStatus } from '@prisma/client'
import { addDaysMadrid, addMonthsMadrid } from '@/lib/dates'
import { onBookingCreated } from '@/lib/notifications/booking-notifications'
import { runSideEffects, type SideEffect } from '@/lib/side-effects'

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
      include: { user: { select: { name: true } } },
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

    // Each future instance is created PENDING (the cleaner still has to
    // confirm every occurrence), so arm the 1h/2h/6h reminder chain for all
    // of them - this path used to leave them unarmed. The original booking
    // being made recurring is already CONFIRMED/COMPLETED (checked above),
    // so it does not need a tracker.
    const sideEffects: SideEffect[] = createdBookings.map((created) => ({
      label: `booking-reminder-chain:recurring:${created.id}`,
      promise: onBookingCreated({
        id: created.id,
        cleanerId: created.cleanerId,
        ownerName: owner.user.name || 'Villa Owner',
        propertyName: booking.property.name,
        service: created.service,
        date: created.date,
        time: created.time,
        price: Number(created.price),
      }),
    }))

    await runSideEffects(sideEffects)

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
