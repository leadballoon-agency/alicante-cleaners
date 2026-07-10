import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { addDaysMadrid } from '@/lib/dates'
import { onBookingCreated } from '@/lib/notifications/booking-notifications'
import { runSideEffects } from '@/lib/side-effects'

// POST - Create a new booking based on an existing one (1-click rebook)
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

    // Get the owner
    const owner = await db.owner.findFirst({
      where: { user: { email: session.user.email } },
      include: { user: { select: { name: true } } },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Get the original booking
    const originalBooking = await db.booking.findFirst({
      where: {
        id,
        ownerId: owner.id,
      },
      include: {
        property: true,
        cleaner: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!originalBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if cleaner is still active
    if (originalBooking.cleaner.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This cleaner is no longer available' },
        { status: 400 }
      )
    }

    // Calculate next available date (same day next week by default).
    // Shift by a Madrid calendar week rather than a raw 7*24h offset so the
    // booking keeps the same Madrid wall-clock time across any DST change.
    let nextDate = addDaysMadrid(originalBooking.date, 7)

    // If that date is in the past, use today + 7 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (nextDate < today) {
      nextDate = addDaysMadrid(today, 7)
    }

    // Generate a short code for WhatsApp commands
    const shortCode = Math.floor(1000 + Math.random() * 9000).toString()

    // Create the new booking
    const newBooking = await db.booking.create({
      data: {
        cleanerId: originalBooking.cleanerId,
        ownerId: originalBooking.ownerId,
        propertyId: originalBooking.propertyId,
        status: 'PENDING',
        service: originalBooking.service,
        price: originalBooking.price,
        hours: originalBooking.hours,
        date: nextDate,
        time: originalBooking.time,
        notes: originalBooking.notes,
        shortCode,
        // Don't copy recurring settings - this is a one-off rebook
        isRecurring: false,
      },
      include: {
        cleaner: {
          include: {
            user: true,
          },
        },
        property: true,
      },
    })

    // TODO: Send WhatsApp notification to cleaner about new booking request

    // Rebooked bookings start PENDING just like any other booking - the
    // cleaner still has to confirm, so arm the same 1h/2h/6h reminder chain
    // (this path used to leave it unarmed - a rebooked job could sit
    // unconfirmed forever with no reminder or escalation).
    await runSideEffects([
      {
        label: `booking-reminder-chain:rebook:${newBooking.id}`,
        promise: onBookingCreated({
          id: newBooking.id,
          cleanerId: newBooking.cleanerId,
          ownerName: owner.user.name || 'Villa Owner',
          propertyName: newBooking.property.name,
          service: newBooking.service,
          date: newBooking.date,
          time: newBooking.time,
          price: Number(newBooking.price),
        }),
      },
    ])

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: newBooking.id,
        date: newBooking.date,
        time: newBooking.time,
        status: newBooking.status,
        service: newBooking.service,
        price: Number(newBooking.price),
        cleanerName: newBooking.cleaner.user.name,
        propertyName: newBooking.property.name,
      },
    })
  } catch (error) {
    console.error('Error creating rebook:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
